import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
} from "../../domain/holiday/types";
import { MonthloomDatabase } from "../../persistence/db/monthloomDb";
import { HolidayLibraryRepository } from "../../persistence/db/holidayLibraryRepository";
import { useHolidayLibraryStore } from "./holidayLibraryStore";

describe("holidayLibraryStore", () => {
  let db: MonthloomDatabase;
  let repo: HolidayLibraryRepository;

  beforeEach(() => {
    db = new MonthloomDatabase(`test-store-db-${Math.random()}`);
    repo = new HolidayLibraryRepository(db);
    useHolidayLibraryStore.setState({
      snapshot: {
        calendars: [],
        baseRecords: [],
        overrides: [],
        coverage: [],
        syncStates: [],
      },
      status: "idle",
      error: null,
    });
  });

  it("hydrates built-in calendars into store snapshot", async () => {
    await useHolidayLibraryStore.getState().hydrate(repo);

    const state = useHolidayLibraryStore.getState();
    expect(state.status).toBe("ready");
    expect(state.snapshot.calendars.map((c) => c.id)).toContain(
      BUILTIN_CHINA_CALENDAR_ID,
    );
    expect(state.snapshot.calendars.map((c) => c.id)).toContain(
      BUILTIN_JAPAN_CALENDAR_ID,
    );
  });

  it("refreshes store snapshot after changes in repository", async () => {
    await useHolidayLibraryStore.getState().hydrate(repo);

    await repo.upsertCalendar({
      id: "custom-cal-1",
      name: "Custom 1",
      builtin: false,
      createdAt: "2026-08-28T00:00:00.000Z",
      updatedAt: "2026-08-28T00:00:00.000Z",
    });

    await useHolidayLibraryStore.getState().refresh(repo);

    const state = useHolidayLibraryStore.getState();
    expect(state.snapshot.calendars.map((c) => c.id)).toContain("custom-cal-1");
  });
});
