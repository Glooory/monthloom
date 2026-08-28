import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { BUILTIN_CHINA_CALENDAR_ID } from "../../domain/holiday/types";
import { MonthloomDatabase } from "../../persistence/db/monthloomDb";
import { HolidayLibraryOperations } from "./holidayLibraryOperations";

describe("HolidayLibraryOperations", () => {
  let db: MonthloomDatabase;
  let ops: HolidayLibraryOperations;

  beforeEach(async () => {
    db = new MonthloomDatabase(`test-ops-db-${Math.random()}`);
    ops = new HolidayLibraryOperations(db);
    const repo = ops["repo"];
    await repo.ensureBuiltins();
  });

  it("prepares and applies a provider sync update", async () => {
    const fakeChinaJson = {
      code: 0,
      holiday: {
        "01-01": { holiday: true, name: "元旦", date: "2027-01-01" },
        "02-06": { holiday: false, name: "工作日", date: "2027-02-06" },
      },
    };

    const mockFetch = (async () => ({
      ok: true,
      json: async () => fakeChinaJson,
    })) as unknown as typeof fetch;

    const prepared = await ops.prepareSyncYear(
      BUILTIN_CHINA_CALENDAR_ID,
      2027,
      mockFetch,
    );
    expect(prepared.summary.added).toBe(2);
    expect(prepared.update.records).toHaveLength(2);

    const summary = await ops.applyPreparedUpdate(prepared);
    expect(summary.added).toBe(2);

    const savedRecords = await db.holidayBaseRecords.toArray();
    expect(savedRecords).toHaveLength(2);
  });

  it("upserts manual date ranges across multiple days", async () => {
    await ops.upsertManualDateRange({
      calendarId: BUILTIN_CHINA_CALENDAR_ID,
      start: { year: 2027, month: 5, day: 1 },
      end: { year: 2027, month: 5, day: 3 },
      type: "holiday",
      name: "May Holiday",
    });

    const overrides = await db.holidayOverrides.toArray();
    expect(overrides).toHaveLength(3);
    expect(overrides.map((o) => o.date.day)).toEqual([1, 2, 3]);
  });

  it("masks baseline record with delete override when deleting baseline date", async () => {
    // 1. Put baseline record
    await ops.applyPreparedUpdate({
      calendarId: BUILTIN_CHINA_CALENDAR_ID,
      update: {
        calendarId: BUILTIN_CHINA_CALENDAR_ID,
        records: [
          {
            id: `${BUILTIN_CHINA_CALENDAR_ID}:2027-01-01`,
            calendarId: BUILTIN_CHINA_CALENDAR_ID,
            date: { year: 2027, month: 1, day: 1 },
            type: "holiday",
            name: "元旦",
            source: "sync",
            updatedAt: "2026-08-28T00:00:00.000Z",
          },
        ],
        coverage: [],
        replacementRanges: [],
      },
      summary: { added: 1, updated: 0, deleted: 0, retainedOverrides: 0 },
    });

    // 2. Delete the record
    await ops.deleteRecord(BUILTIN_CHINA_CALENDAR_ID, {
      year: 2027,
      month: 1,
      day: 1,
    });

    const overrides = await db.holidayOverrides.toArray();
    expect(overrides).toHaveLength(1);
    expect(overrides[0].kind).toBe("delete");

    // 3. Restore source record
    await ops.restoreSourceRecord(BUILTIN_CHINA_CALENDAR_ID, {
      year: 2027,
      month: 1,
      day: 1,
    });
    const remainingOverrides = await db.holidayOverrides.toArray();
    expect(remainingOverrides).toHaveLength(0);
  });

  it("checks reference before deleting a custom calendar", async () => {
    const cal = await ops.createCalendar("Team Offsites");

    // Attempting to delete when referenced in active document throws
    const activeDoc: any = {
      holidayLayers: [{ id: "l1", calendarId: cal.id, enabled: true }],
    };
    await expect(ops.deleteCalendar(cal.id, activeDoc)).rejects.toThrow(
      /referenced by an active holiday layer/,
    );

    // Deleting when unreferenced succeeds
    await ops.deleteCalendar(cal.id, { holidayLayers: [] } as any);
    const existing = await db.holidayCalendars.get(cal.id);
    expect(existing).toBeUndefined();
  });

  it("keeps prepareMonthloomImport pure and creates new calendar only on apply", async () => {
    const rawJson = {
      format: "monthloom-holidays",
      version: 1,
      calendar: {
        id: "cal-preview-test",
        name: "Preview Test Calendar",
      },
      records: [
        {
          date: "2027-01-01",
          type: "holiday",
          name: "New Year",
        },
      ],
      coverage: [
        {
          start: "2027-01-01",
          end: "2027-12-31",
          status: "confirmed",
        },
      ],
    };

    // 1. Prepare import (preview)
    const prepared = await ops.prepareMonthloomImport(rawJson);
    expect(prepared.summary.added).toBe(1);
    expect(prepared.newCalendar?.id).toBe("cal-preview-test");

    // Verify nothing written to DB during prepare
    const calBefore = await db.holidayCalendars.get("cal-preview-test");
    expect(calBefore).toBeUndefined();
    const recsBefore = await db.holidayBaseRecords.where("calendarId").equals("cal-preview-test").toArray();
    expect(recsBefore).toHaveLength(0);

    // 2. Apply prepared update
    await ops.applyPreparedUpdate(prepared);

    // Verify calendar and records are persisted now
    const calAfter = await db.holidayCalendars.get("cal-preview-test");
    expect(calAfter?.name).toBe("Preview Test Calendar");
    const recsAfter = await db.holidayBaseRecords.where("calendarId").equals("cal-preview-test").toArray();
    expect(recsAfter).toHaveLength(1);
  });

  it("does not replace baseline records when coverage is unconfirmed", async () => {
    const unconfirmedJson = {
      format: "monthloom-holidays",
      version: 1,
      calendar: {
        id: "cal-unconfirmed",
        name: "Unconfirmed Calendar",
      },
      records: [],
      coverage: [
        {
          start: "2027-01-01",
          end: "2027-12-31",
          status: "unconfirmed",
        },
      ],
    };

    const prepared = await ops.prepareMonthloomImport(unconfirmedJson);
    expect(prepared.update.replacementRanges).toHaveLength(0);
  });

  it("throws error on targetCalendarId mismatch", async () => {
    const json = {
      format: "monthloom-holidays",
      version: 1,
      calendar: {
        id: "cal-1",
        name: "Cal 1",
      },
      records: [],
      coverage: [],
    };

    await expect(
      ops.prepareMonthloomImport(json, "cal-2"),
    ).rejects.toThrow(/Calendar ID mismatch/);
  });
});
