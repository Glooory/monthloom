import { describe, expect, it } from "vitest";
import { normalizeChinaTimorHolidayYear } from "../holiday/adapters/chinaTimorHolidayAdapter";
import { normalizeJapanHolidaysJp } from "../holiday/adapters/japanHolidaysJpAdapter";
import { getUncoveredCalendarRanges } from "../holiday/coverage";
import { resolveHolidayIndex } from "../holiday/resolveHolidayIndex";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
  type HolidayLibrarySnapshot,
} from "../holiday/types";
import { createDefaultHolidayLayers } from "../template/holidayLayer";
import { generateCalendarMonth } from "./generateCalendarMonth";
import { calculateRequiredHolidayRange } from "./monthSequence";

describe("Calendar Domain End-to-End Integration", () => {
  it("processes raw third-party holiday data into calendar months and coverage diagnostics", () => {
    const japanRaw = {
      "2027-01-01": "元日",
    };

    const chinaRaw = {
      code: 0,
      holiday: {
        "01-01": {
          holiday: true,
          name: "元旦",
          wage: 3,
          date: "2027-01-01",
        },
        "02-06": {
          holiday: false,
          name: "春节前补班",
          wage: 1,
          after: false,
          target: "春节",
          date: "2027-02-06",
        },
      },
    };

    // 1. Adapter normalization
    const japanUpdate = normalizeJapanHolidaysJp(
      japanRaw,
      BUILTIN_JAPAN_CALENDAR_ID,
      "sync",
    );
    const chinaUpdate = normalizeChinaTimorHolidayYear(
      chinaRaw,
      BUILTIN_CHINA_CALENDAR_ID,
      "sync",
    );

    expect(japanUpdate.records.length).toBe(1);
    expect(chinaUpdate.records.length).toBe(2);

    // 2. Build Library snapshot
    const library: HolidayLibrarySnapshot = {
      calendars: [
        {
          id: BUILTIN_CHINA_CALENDAR_ID,
          name: "中国法定节假日",
          builtin: true,
          provider: "china-timor",
          createdAt: "2026-08-28T00:00:00.000Z",
          updatedAt: "2026-08-28T00:00:00.000Z",
        },
        {
          id: BUILTIN_JAPAN_CALENDAR_ID,
          name: "日本祝日",
          builtin: true,
          provider: "japan-holidays-jp",
          createdAt: "2026-08-28T00:00:00.000Z",
          updatedAt: "2026-08-28T00:00:00.000Z",
        },
      ],
      baseRecords: [...chinaUpdate.records, ...japanUpdate.records],
      overrides: [],
      coverage: [...chinaUpdate.coverage, ...japanUpdate.coverage],
      syncStates: [],
    };

    // 3. Resolve holiday index with default layers
    const layers = createDefaultHolidayLayers();
    const holidayIndex = resolveHolidayIndex({ library, layers });

    // 4. Generate Calendar Month (January 2027)
    const jan2027 = generateCalendarMonth(2027, 1, holidayIndex);

    expect(jan2027.year).toBe(2027);
    expect(jan2027.month).toBe(1);
    expect(jan2027.weekCount).toBe(6);

    // Adjacent leading cell from December 2026
    expect(jan2027.weeks[0][0]).toEqual({
      date: { year: 2026, month: 12, day: 27 },
      dayOfWeek: 0,
      inCurrentMonth: false,
    });

    // January 1st has merged China and Japan holiday occurrences
    const jan1Cell = jan2027.weeks[0][5];
    expect(jan1Cell).toBeDefined();
    expect(jan1Cell.date).toEqual({ year: 2027, month: 1, day: 1 });
    expect(jan1Cell.inCurrentMonth).toBe(true);
    expect(jan1Cell.holiday?.occurrences).toEqual([
      {
        layerId: "builtin-cn-layer",
        calendarId: BUILTIN_CHINA_CALENDAR_ID,
        type: "holiday",
        name: "元旦",
      },
      {
        layerId: "builtin-jp-layer",
        calendarId: BUILTIN_JAPAN_CALENDAR_ID,
        type: "holiday",
        name: "元日",
      },
    ]);

    // 5. Calculate required range for target year 2027
    const requiredRange = calculateRequiredHolidayRange(2027);
    expect(requiredRange).toEqual({
      start: { year: 2026, month: 12, day: 1 },
      end: { year: 2028, month: 2, day: 29 },
    });

    // 6. Check coverage gaps
    const chinaCoverage = library.coverage.filter(
      (c) => c.calendarId === BUILTIN_CHINA_CALENDAR_ID,
    );
    const chinaGaps = getUncoveredCalendarRanges(
      requiredRange,
      chinaCoverage,
      BUILTIN_CHINA_CALENDAR_ID,
    );
    expect(chinaGaps).toEqual([
      {
        start: { year: 2026, month: 12, day: 1 },
        end: { year: 2026, month: 12, day: 31 },
      },
      {
        start: { year: 2028, month: 1, day: 1 },
        end: { year: 2028, month: 2, day: 29 },
      },
    ]);
  });
});
