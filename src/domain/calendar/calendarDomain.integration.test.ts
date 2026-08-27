import { describe, expect, it } from "vitest";
import { parseChinaTimorHolidayYear } from "../holiday/adapters/chinaTimorHolidayAdapter";
import { parseJapanHolidaysJp } from "../holiday/adapters/japanHolidaysJpAdapter";
import { createCoverageDiagnostics } from "../holiday/coverage";
import { buildHolidayIndex } from "../holiday/holidayIndex";
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
    const japanDataset = parseJapanHolidaysJp(japanRaw);
    const chinaDataset = parseChinaTimorHolidayYear(chinaRaw);

    expect(japanDataset.diagnostics).toEqual([]);
    expect(chinaDataset.diagnostics).toEqual([]);

    expect(chinaDataset.entries).toContainEqual({
      date: { year: 2027, month: 2, day: 6 },
      info: {
        china: {
          type: "workday",
          name: "春节前补班",
        },
      },
    });

    // 2. Build index
    const holidayIndex = buildHolidayIndex([chinaDataset, japanDataset]);

    // 3. Generate Calendar Month (January 2027)
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

    // January 1st has merged China and Japan holiday info
    const jan1Cell = jan2027.weeks[0][5];
    expect(jan1Cell).toEqual({
      date: { year: 2027, month: 1, day: 1 },
      dayOfWeek: 5,
      inCurrentMonth: true,
      holiday: {
        china: {
          type: "holiday",
          name: "元旦",
        },
        japan: {
          name: "元日",
        },
      },
    });

    // 4. Calculate required range for target year 2027
    const requiredRange = calculateRequiredHolidayRange(2027);
    expect(requiredRange).toEqual({
      start: { year: 2026, month: 12, day: 1 },
      end: { year: 2028, month: 2, day: 29 },
    });

    // 5. Check coverage diagnostics
    const japanCoverageDiag = createCoverageDiagnostics(
      japanDataset.source,
      requiredRange,
      japanDataset.coverage,
    );
    expect(japanCoverageDiag).toEqual([
      {
        level: "warning",
        code: "holiday-coverage-gap",
        message:
          "japan-holidays-jp holiday data does not cover 2026-12-01 through 2026-12-31.",
      },
      {
        level: "warning",
        code: "holiday-coverage-gap",
        message:
          "japan-holidays-jp holiday data does not cover 2028-01-01 through 2028-02-29.",
      },
    ]);

    const chinaCoverageDiag = createCoverageDiagnostics(
      chinaDataset.source,
      requiredRange,
      chinaDataset.coverage,
    );
    expect(chinaCoverageDiag).toEqual([
      {
        level: "warning",
        code: "holiday-coverage-gap",
        message:
          "china-timor holiday data does not cover 2026-12-01 through 2026-12-31.",
      },
      {
        level: "warning",
        code: "holiday-coverage-gap",
        message:
          "china-timor holiday data does not cover 2028-01-01 through 2028-02-29.",
      },
    ]);
  });
});
