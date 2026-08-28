import { addDays, compareDate, toISODate } from "../../domain/date/date";
import type { DateRange, LocalDate } from "../../domain/date/types";
import {
  fetchChinaHolidayYear,
  normalizeChinaTimorHolidayYear,
} from "../../domain/holiday/adapters/chinaTimorHolidayAdapter";
import {
  fetchJapanHolidayYear,
  normalizeJapanHolidaysJp,
} from "../../domain/holiday/adapters/japanHolidaysJpAdapter";
import { parseMonthloomHolidayJson } from "../../domain/holiday/monthloomJson";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
  holidayRecordId,
  type HolidayBaseRecord,
  type HolidayBaseUpdate,
  type HolidayCalendar,
  type HolidayCoverage,
  type HolidayOverride,
  type HolidayProviderId,
  type HolidayRecordType,
  type HolidaySyncState,
} from "../../domain/holiday/types";
import type { EditorDocument } from "../../editor/model/types";
import type { MonthloomDatabase } from "../../persistence/db/monthloomDb";
import { HolidayLibraryRepository } from "../../persistence/db/holidayLibraryRepository";

export type HolidayChangeSummary = Readonly<{
  added: number;
  updated: number;
  deleted: number;
  retainedOverrides: number;
}>;

export type PreparedHolidayUpdate = Readonly<{
  calendarId: string;
  update: HolidayBaseUpdate;
  summary: HolidayChangeSummary;
  syncState?: HolidaySyncState;
  newCalendar?: HolidayCalendar;
}>;

export type ManualHolidayRecordInput = Readonly<{
  calendarId: string;
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
}>;

export type ManualHolidayDateRangeInput = Readonly<{
  calendarId: string;
  start: LocalDate;
  end: LocalDate;
  type: HolidayRecordType;
  name?: string;
}>;

export class HolidayLibraryOperations {
  private readonly repo: HolidayLibraryRepository;

  constructor(private readonly db: MonthloomDatabase) {
    this.repo = new HolidayLibraryRepository(db);
  }

  async createCalendar(name: string): Promise<HolidayCalendar> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Holiday calendar name cannot be empty.");
    }
    const id = `cal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const calendar: HolidayCalendar = {
      id,
      name: trimmed,
      builtin: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.upsertCalendar(calendar);
    return calendar;
  }

  async renameCalendar(calendarId: string, name: string): Promise<void> {
    if (
      calendarId === BUILTIN_CHINA_CALENDAR_ID ||
      calendarId === BUILTIN_JAPAN_CALENDAR_ID
    ) {
      throw new Error("Cannot rename built-in holiday calendars.");
    }
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Holiday calendar name cannot be empty.");
    }
    const existing = await this.db.holidayCalendars.get(calendarId);
    if (!existing) {
      throw new Error(`Holiday calendar not found: ${calendarId}`);
    }
    await this.repo.upsertCalendar({
      ...existing,
      name: trimmed,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteCalendar(
    calendarId: string,
    activeDocument?: EditorDocument,
  ): Promise<void> {
    if (
      calendarId === BUILTIN_CHINA_CALENDAR_ID ||
      calendarId === BUILTIN_JAPAN_CALENDAR_ID
    ) {
      throw new Error("Cannot delete built-in holiday calendars.");
    }

    // Check active document
    if (
      activeDocument?.holidayLayers?.some(
        (layer) => layer.calendarId === calendarId,
      )
    ) {
      throw new Error(
        "Cannot delete holiday calendar: It is referenced by an active holiday layer in the editor.",
      );
    }

    // Check saved templates
    const templates = await this.db.templates.toArray();
    for (const t of templates) {
      if (t.document.holidayLayers?.some((l) => l.calendarId === calendarId)) {
        throw new Error(
          `Cannot delete holiday calendar: It is referenced by template "${t.name}".`,
        );
      }
    }

    // Check saved projects
    const projects = await this.db.projects.toArray();
    for (const p of projects) {
      if (p.document.holidayLayers?.some((l) => l.calendarId === calendarId)) {
        throw new Error(
          `Cannot delete holiday calendar: It is referenced by project "${p.name}".`,
        );
      }
    }

    await this.repo.deleteCalendar(calendarId);
  }

  async prepareSyncYear(
    calendarId: string,
    year: number,
    fetchImpl: typeof fetch = fetch,
  ): Promise<PreparedHolidayUpdate> {
    let update: HolidayBaseUpdate;
    const now = new Date().toISOString();

    try {
      if (calendarId === BUILTIN_CHINA_CALENDAR_ID) {
        update = await fetchChinaHolidayYear(year, fetchImpl, calendarId);
      } else if (calendarId === BUILTIN_JAPAN_CALENDAR_ID) {
        update = await fetchJapanHolidayYear(year, fetchImpl, calendarId);
      } else {
        throw new Error(
          `Remote synchronization is not supported for custom calendar: ${calendarId}`,
        );
      }

      const summary = await this.computeChangeSummary(calendarId, update);
      return {
        calendarId,
        update,
        summary,
        syncState: {
          calendarId,
          status: "success",
          lastAttemptAt: now,
          lastSuccessAt: now,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.repo.recordSyncFailure(calendarId, message, now);
      throw err;
    }
  }

  async prepareProviderImport(
    calendarId: string,
    provider: HolidayProviderId,
    _year: number,
    raw: unknown,
  ): Promise<PreparedHolidayUpdate> {
    let update: HolidayBaseUpdate;
    if (provider === "china-timor") {
      update = normalizeChinaTimorHolidayYear(raw, calendarId, "provider-import");
    } else if (provider === "japan-holidays-jp") {
      update = normalizeJapanHolidaysJp(raw, calendarId, "provider-import");
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const summary = await this.computeChangeSummary(calendarId, update);
    return {
      calendarId,
      update,
      summary,
    };
  }

  async prepareMonthloomImport(
    raw: unknown,
    targetCalendarId?: string,
  ): Promise<PreparedHolidayUpdate> {
    const exchange = parseMonthloomHolidayJson(raw);
    if (targetCalendarId && targetCalendarId !== exchange.calendar.id) {
      throw new Error(
        `Calendar ID mismatch: Monthloom JSON calendar ID "${exchange.calendar.id}" does not match target calendar ID "${targetCalendarId}".`,
      );
    }
    const calendarId = targetCalendarId ?? exchange.calendar.id;

    // Check whether calendar needs creation without mutating database during preview
    const existing = await this.db.holidayCalendars.get(calendarId);
    let newCalendar: HolidayCalendar | undefined;
    if (!existing) {
      const now = new Date().toISOString();
      newCalendar = {
        id: calendarId,
        name: exchange.calendar.name,
        builtin: false,
        createdAt: now,
        updatedAt: now,
      };
    }

    // Only CONFIRMED coverage creates replacement ranges
    const replacementRanges: DateRange[] = exchange.coverage
      .filter((cov) => cov.status === "confirmed")
      .map((cov) => ({
        start: cov.start,
        end: cov.end,
      }));

    const update: HolidayBaseUpdate = {
      calendarId,
      records: exchange.records.map((r) => ({
        ...r,
        calendarId,
        id: holidayRecordId(calendarId, r.date),
      })),
      coverage: exchange.coverage.map((cov) => ({
        ...cov,
        calendarId,
      })),
      replacementRanges,
    };

    const summary = await this.computeChangeSummary(calendarId, update);
    return {
      calendarId,
      update,
      summary,
      newCalendar,
    };
  }

  async applyPreparedUpdate(
    prepared: PreparedHolidayUpdate,
  ): Promise<HolidayChangeSummary> {
    await this.repo.applyBaseUpdate(
      prepared.update,
      prepared.syncState,
      prepared.newCalendar,
    );
    return prepared.summary;
  }


  async upsertManualRecord(input: ManualHolidayRecordInput): Promise<void> {
    const override: HolidayOverride = {
      id: holidayRecordId(input.calendarId, input.date),
      calendarId: input.calendarId,
      date: input.date,
      kind: "upsert",
      type: input.type,
      ...(input.name ? { name: input.name } : {}),
      updatedAt: new Date().toISOString(),
    };
    await this.repo.putOverride(override);
  }

  async upsertManualDateRange(
    input: ManualHolidayDateRangeInput,
  ): Promise<void> {
    if (compareDate(input.start, input.end) > 0) {
      throw new Error("Start date must be on or before end date.");
    }
    const now = new Date().toISOString();
    let cursor = input.start;

    await this.db.transaction("rw", this.db.holidayOverrides, async () => {
      while (compareDate(cursor, input.end) <= 0) {
        const override: HolidayOverride = {
          id: holidayRecordId(input.calendarId, cursor),
          calendarId: input.calendarId,
          date: cursor,
          kind: "upsert",
          type: input.type,
          ...(input.name ? { name: input.name } : {}),
          updatedAt: now,
        };
        await this.db.holidayOverrides.put(override);
        cursor = addDays(cursor, 1);
      }
    });
  }

  async deleteRecord(calendarId: string, date: LocalDate): Promise<void> {
    const recordId = holidayRecordId(calendarId, date);
    const existingBase = await this.db.holidayBaseRecords.get(recordId);

    if (existingBase) {
      // Create a delete override to mask baseline
      const override: HolidayOverride = {
        id: recordId,
        calendarId,
        date,
        kind: "delete",
        updatedAt: new Date().toISOString(),
      };
      await this.repo.putOverride(override);
    } else {
      // Just clear any manual upsert
      await this.repo.clearOverride(calendarId, date);
    }
  }

  async restoreSourceRecord(
    calendarId: string,
    date: LocalDate,
  ): Promise<void> {
    await this.repo.clearOverride(calendarId, date);
  }

  async markCoverageConfirmed(
    calendarId: string,
    range: DateRange,
  ): Promise<void> {
    const coverage: HolidayCoverage = {
      id: `${calendarId}:${toISODate(range.start)}_${toISODate(range.end)}`,
      calendarId,
      start: range.start,
      end: range.end,
      status: "confirmed",
      source: "manual",
      updatedAt: new Date().toISOString(),
    };
    await this.db.holidayCoverage.put(coverage);
  }

  private async computeChangeSummary(
    calendarId: string,
    update: HolidayBaseUpdate,
  ): Promise<HolidayChangeSummary> {
    const existingBaseRecords = await this.db.holidayBaseRecords
      .where("calendarId")
      .equals(calendarId)
      .toArray();

    const existingMap = new Map<string, HolidayBaseRecord>();
    for (const r of existingBaseRecords) {
      existingMap.set(toISODate(r.date), r);
    }

    const overrides = await this.db.holidayOverrides
      .where("calendarId")
      .equals(calendarId)
      .toArray();

    const overrideKeys = new Set(overrides.map((o) => toISODate(o.date)));

    let added = 0;
    let updated = 0;
    let retainedOverrides = 0;

    const newKeys = new Set<string>();

    for (const record of update.records) {
      const key = toISODate(record.date);
      newKeys.add(key);

      if (overrideKeys.has(key)) {
        retainedOverrides++;
      }

      const existing = existingMap.get(key);
      if (!existing) {
        added++;
      } else if (
        existing.type !== record.type ||
        existing.name !== record.name
      ) {
        updated++;
      }
    }

    let deleted = 0;
    for (const range of update.replacementRanges) {
      for (const [key, existing] of existingMap) {
        if (
          compareDate(range.start, existing.date) <= 0 &&
          compareDate(existing.date, range.end) <= 0 &&
          !newKeys.has(key)
        ) {
          deleted++;
        }
      }
    }

    return {
      added,
      updated,
      deleted,
      retainedOverrides,
    };
  }
}
