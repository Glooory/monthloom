import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
} from "../../domain/holiday/types";
import { base, overrideUpsert } from "../../domain/holiday/testFixtures";
import { MonthloomDatabase } from "./monthloomDb";
import { HolidayLibraryRepository } from "./holidayLibraryRepository";

describe("HolidayLibraryRepository", () => {
  let db: MonthloomDatabase;
  let repo: HolidayLibraryRepository;

  beforeEach(async () => {
    db = new MonthloomDatabase(`test-holiday-db-${Math.random()}`);
    repo = new HolidayLibraryRepository(db);
    await repo.ensureBuiltins();
  });

  it("seeds built-in China and Japan calendars without duplication", async () => {
    const snapshot = await repo.getSnapshot();
    expect(snapshot.calendars.map((c) => c.id)).toContain(
      BUILTIN_CHINA_CALENDAR_ID,
    );
    expect(snapshot.calendars.map((c) => c.id)).toContain(
      BUILTIN_JAPAN_CALENDAR_ID,
    );

    await repo.ensureBuiltins();
    const second = await repo.getSnapshot();
    expect(second.calendars).toHaveLength(2);
  });

  it("applies atomic base updates and preserves manual overrides", async () => {
    await repo.putOverride(
      overrideUpsert(
        BUILTIN_CHINA_CALENDAR_ID,
        "2027-01-01",
        "holiday",
        "My New Year",
      ),
    );
    await repo.applyBaseUpdate({
      calendarId: BUILTIN_CHINA_CALENDAR_ID,
      records: [
        base(BUILTIN_CHINA_CALENDAR_ID, "2027-01-01", "holiday", "元旦"),
      ],
      replacementRanges: [
        {
          start: { year: 2027, month: 1, day: 1 },
          end: { year: 2027, month: 12, day: 31 },
        },
      ],
      coverage: [
        {
          id: `${BUILTIN_CHINA_CALENDAR_ID}:2027`,
          calendarId: BUILTIN_CHINA_CALENDAR_ID,
          start: { year: 2027, month: 1, day: 1 },
          end: { year: 2027, month: 12, day: 31 },
          status: "confirmed",
          source: "sync",
          updatedAt: "2026-08-28T00:00:00.000Z",
        },
      ],
    });

    const snapshot = await repo.getSnapshot();
    expect(snapshot.overrides).toHaveLength(1);
    expect(snapshot.baseRecords).toHaveLength(1);
  });

  it("deletes a custom calendar and all its related records", async () => {
    await repo.upsertCalendar({
      id: "custom-cal",
      name: "Custom Calendar",
      builtin: false,
      createdAt: "2026-08-28T00:00:00.000Z",
      updatedAt: "2026-08-28T00:00:00.000Z",
    });
    await repo.applyBaseUpdate({
      calendarId: "custom-cal",
      records: [base("custom-cal", "2027-05-01", "holiday", "Custom Holiday")],
      replacementRanges: [],
      coverage: [],
    });

    let snapshot = await repo.getSnapshot();
    expect(snapshot.calendars.map((c) => c.id)).toContain("custom-cal");

    await repo.deleteCalendar("custom-cal");

    snapshot = await repo.getSnapshot();
    expect(snapshot.calendars.map((c) => c.id)).not.toContain("custom-cal");
    expect(
      snapshot.baseRecords.filter((r) => r.calendarId === "custom-cal"),
    ).toHaveLength(0);
  });

  it("rejects deletion of built-in calendars", async () => {
    await expect(
      repo.deleteCalendar(BUILTIN_CHINA_CALENDAR_ID),
    ).rejects.toThrow(/Cannot delete built-in/);
  });

  it("validates entities with Zod schemas at persistence boundaries", async () => {
    // Invalid calendar name / empty id
    await expect(
      repo.upsertCalendar({
        id: "",
        name: "Test",
        builtin: false,
        createdAt: "2026-08-28T00:00:00.000Z",
        updatedAt: "2026-08-28T00:00:00.000Z",
      }),
    ).rejects.toThrow(/Invalid holiday calendar/);

    // Invalid local date in override
    await expect(
      repo.putOverride({
        id: "cn:2027-02-31",
        calendarId: "cn",
        date: { year: 2027, month: 2, day: 31 },
        kind: "upsert",
        type: "holiday",
        updatedAt: "2026-08-28T00:00:00.000Z",
      }),
    ).rejects.toThrow(/Invalid holiday override/);
  });

  it("atomically creates new calendar and base records, rolling back all changes if any validation or write fails", async () => {
    const newCal = {
      id: "cal-atomic-fail",
      name: "Atomic Test Calendar",
      builtin: false,
      createdAt: "2026-08-28T00:00:00.000Z",
      updatedAt: "2026-08-28T00:00:00.000Z",
    };

    // Attempt to apply update where newCalendar is valid but a record has invalid date
    await expect(
      repo.applyBaseUpdate(
        {
          calendarId: "cal-atomic-fail",
          records: [
            {
              id: "cal-atomic-fail:2027-02-31",
              calendarId: "cal-atomic-fail",
              date: { year: 2027, month: 2, day: 31 }, // invalid!
              type: "holiday",
              source: "monthloom-import",
              updatedAt: "2026-08-28T00:00:00.000Z",
            },
          ],
          coverage: [],
          replacementRanges: [],
        },
        undefined,
        newCal,
      ),
    ).rejects.toThrow();

    // Verify calendar was not created
    const foundCal = await db.holidayCalendars.get("cal-atomic-fail");
    expect(foundCal).toBeUndefined();
    const foundRecs = await db.holidayBaseRecords.where("calendarId").equals("cal-atomic-fail").toArray();
    expect(foundRecs).toHaveLength(0);
  });
});

