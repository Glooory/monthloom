import { compareDate } from "../../domain/date/date";
import type { LocalDate } from "../../domain/date/types";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
  holidayRecordId,
  type HolidayBaseUpdate,
  type HolidayCalendar,
  type HolidayLibrarySnapshot,
  type HolidayOverride,
  type HolidaySyncState,
} from "../../domain/holiday/types";
import {
  validateHolidayBaseRecord,
  validateHolidayCalendar,
  validateHolidayCoverage,
  validateHolidayLibrarySnapshot,
  validateHolidayOverride,
  validateHolidaySyncState,
} from "../schema/validation";
import type { MonthloomDatabase } from "./monthloomDb";

export class HolidayLibraryRepository {
  constructor(readonly db: MonthloomDatabase) {}


  async ensureBuiltins(): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.holidayCalendars, async () => {
      const cn = await this.db.holidayCalendars.get(BUILTIN_CHINA_CALENDAR_ID);
      if (!cn) {
        const cnCalendar = validateHolidayCalendar({
          id: BUILTIN_CHINA_CALENDAR_ID,
          name: "中国公众假期",
          builtin: true,
          provider: "china-timor",
          createdAt: now,
          updatedAt: now,
        });
        await this.db.holidayCalendars.put(cnCalendar);
      }

      const jp = await this.db.holidayCalendars.get(BUILTIN_JAPAN_CALENDAR_ID);
      if (!jp) {
        const jpCalendar = validateHolidayCalendar({
          id: BUILTIN_JAPAN_CALENDAR_ID,
          name: "日本公众假期",
          builtin: true,
          provider: "japan-holidays-jp",
          createdAt: now,
          updatedAt: now,
        });
        await this.db.holidayCalendars.put(jpCalendar);
      }
    });
  }

  async getSnapshot(): Promise<HolidayLibrarySnapshot> {
    const [calendars, baseRecords, overrides, coverage, syncStates] =
      await Promise.all([
        this.db.holidayCalendars.toArray(),
        this.db.holidayBaseRecords.toArray(),
        this.db.holidayOverrides.toArray(),
        this.db.holidayCoverage.toArray(),
        this.db.holidaySyncStates.toArray(),
      ]);

    const snapshot = {
      calendars,
      baseRecords,
      overrides,
      coverage,
      syncStates,
    };

    return validateHolidayLibrarySnapshot(snapshot);
  }

  async applyBaseUpdate(
    update: HolidayBaseUpdate,
    syncState?: HolidaySyncState,
    newCalendar?: HolidayCalendar,
  ): Promise<void> {
    const validatedCalendar = newCalendar ? validateHolidayCalendar(newCalendar) : undefined;
    const validatedRecords = update.records.map(validateHolidayBaseRecord);
    const validatedCoverage = update.coverage.map(validateHolidayCoverage);
    const validatedSyncState = syncState ? validateHolidaySyncState(syncState) : undefined;

    await this.db.transaction(
      "rw",
      [
        this.db.holidayCalendars,
        this.db.holidayBaseRecords,
        this.db.holidayCoverage,
        this.db.holidaySyncStates,
      ],
      async () => {
        // 1. Put new calendar if provided
        if (validatedCalendar) {
          await this.db.holidayCalendars.put(validatedCalendar);
        }

        // 2. Delete base records falling within replacementRanges
        if (update.replacementRanges.length > 0) {
          const existingRecords = await this.db.holidayBaseRecords
            .where("calendarId")
            .equals(update.calendarId)
            .toArray();

          const idsToDelete: string[] = [];
          for (const record of existingRecords) {
            for (const range of update.replacementRanges) {
              if (
                compareDate(range.start, record.date) <= 0 &&
                compareDate(record.date, range.end) <= 0
              ) {
                idsToDelete.push(record.id);
                break;
              }
            }
          }

          if (idsToDelete.length > 0) {
            await this.db.holidayBaseRecords.bulkDelete(idsToDelete);
          }
        }

        // 3. Put new base records
        if (validatedRecords.length > 0) {
          await this.db.holidayBaseRecords.bulkPut(validatedRecords);
        }

        // 4. Put coverage
        if (validatedCoverage.length > 0) {
          await this.db.holidayCoverage.bulkPut(validatedCoverage);
        }

        // 5. Put sync state
        if (validatedSyncState) {
          await this.db.holidaySyncStates.put(validatedSyncState);
        }
      },
    );
  }


  async putOverride(override: HolidayOverride): Promise<void> {
    const validated = validateHolidayOverride(override);
    await this.db.holidayOverrides.put(validated);
  }

  async clearOverride(calendarId: string, date: LocalDate): Promise<void> {
    const id = holidayRecordId(calendarId, date);
    await this.db.holidayOverrides.delete(id);
  }

  async upsertCalendar(calendar: HolidayCalendar): Promise<void> {
    const validated = validateHolidayCalendar(calendar);
    await this.db.holidayCalendars.put(validated);
  }

  async deleteCalendar(calendarId: string): Promise<void> {
    if (
      calendarId === BUILTIN_CHINA_CALENDAR_ID ||
      calendarId === BUILTIN_JAPAN_CALENDAR_ID
    ) {
      throw new Error(`Cannot delete built-in holiday calendar: ${calendarId}`);
    }

    await this.db.transaction(
      "rw",
      [
        this.db.holidayCalendars,
        this.db.holidayBaseRecords,
        this.db.holidayOverrides,
        this.db.holidayCoverage,
        this.db.holidaySyncStates,
      ],
      async () => {
        await this.db.holidayCalendars.delete(calendarId);
        const baseRecs = await this.db.holidayBaseRecords
          .where("calendarId")
          .equals(calendarId)
          .primaryKeys();
        await this.db.holidayBaseRecords.bulkDelete(baseRecs);

        const overrides = await this.db.holidayOverrides
          .where("calendarId")
          .equals(calendarId)
          .primaryKeys();
        await this.db.holidayOverrides.bulkDelete(overrides);

        const coverage = await this.db.holidayCoverage
          .where("calendarId")
          .equals(calendarId)
          .primaryKeys();
        await this.db.holidayCoverage.bulkDelete(coverage);

        await this.db.holidaySyncStates.delete(calendarId);
      },
    );
  }

  async recordSyncFailure(
    calendarId: string,
    errorMessage: string,
    attemptedAt: string,
  ): Promise<void> {
    const existing = await this.db.holidaySyncStates.get(calendarId);
    const syncState = validateHolidaySyncState({
      calendarId,
      status: "error",
      lastAttemptAt: attemptedAt,
      lastSuccessAt: existing?.lastSuccessAt,
      errorMessage,
    });
    await this.db.holidaySyncStates.put(syncState);
  }

  async restoreSnapshot(snapshot: HolidayLibrarySnapshot): Promise<void> {
    const validated = validateHolidayLibrarySnapshot(snapshot);
    await this.db.transaction(
      "rw",
      [
        this.db.holidayCalendars,
        this.db.holidayBaseRecords,
        this.db.holidayOverrides,
        this.db.holidayCoverage,
        this.db.holidaySyncStates,
      ],
      async () => {
        if (validated.calendars.length > 0) {
          await this.db.holidayCalendars.bulkPut(validated.calendars);
        }
        if (validated.baseRecords.length > 0) {
          await this.db.holidayBaseRecords.bulkPut(validated.baseRecords);
        }
        if (validated.overrides.length > 0) {
          await this.db.holidayOverrides.bulkPut(validated.overrides);
        }
        if (validated.coverage.length > 0) {
          await this.db.holidayCoverage.bulkPut(validated.coverage);
        }
        if (validated.syncStates.length > 0) {
          await this.db.holidaySyncStates.bulkPut(validated.syncStates);
        }
      },
    );
  }
}
