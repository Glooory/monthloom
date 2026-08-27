import { describe, expect, it } from "vitest";
import { parseChinaTimorHolidayYear } from "./chinaTimorHolidayAdapter";

describe("parseChinaTimorHolidayYear", () => {
  it("normalizes both holidays and makeup workdays", () => {
    const result = parseChinaTimorHolidayYear({
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
    });

    expect(result.source).toBe("china-timor");
    expect(result.entries).toEqual([
      {
        date: { year: 2027, month: 1, day: 1 },
        info: {
          china: {
            type: "holiday",
            name: "元旦",
          },
        },
      },
      {
        date: { year: 2027, month: 2, day: 6 },
        info: {
          china: {
            type: "workday",
            name: "春节前补班",
          },
        },
      },
    ]);

    expect(result.coverage.ranges).toEqual([
      {
        start: { year: 2027, month: 1, day: 1 },
        end: { year: 2027, month: 12, day: 31 },
      },
    ]);
    expect(result.diagnostics).toEqual([]);
  });

  it("does not invent coverage for an empty annual payload", () => {
    const result = parseChinaTimorHolidayYear({
      code: 0,
      holiday: {},
    });

    expect(result.entries).toEqual([]);
    expect(result.coverage.ranges).toEqual([]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        level: "warning",
        code: "china-timor-coverage-unresolved",
      }),
    ]);
  });

  it("returns error diagnostic for malformed source data", () => {
    const result = parseChinaTimorHolidayYear({
      code: 0,
      holiday: {
        "01-01": {
          holiday: "yes",
          date: "2027-01-01",
        },
      },
    });

    expect(result.entries).toEqual([]);
    expect(result.coverage.ranges).toEqual([]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        level: "error",
        code: "invalid-china-timor",
      }),
    ]);
  });

  it("returns error diagnostic when Timor response code is non-zero", () => {
    const result = parseChinaTimorHolidayYear({
      code: -1,
      holiday: {},
    });

    expect(result.entries).toEqual([]);
    expect(result.coverage.ranges).toEqual([]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        level: "error",
        code: "china-timor-error",
      }),
    ]);
  });

  it("returns error diagnostic for invalid date format", () => {
    const result = parseChinaTimorHolidayYear({
      code: 0,
      holiday: {
        "01-01": {
          holiday: true,
          date: "invalid-date",
        },
      },
    });

    expect(result.entries).toEqual([]);
    expect(result.coverage.ranges).toEqual([]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        level: "error",
        code: "invalid-china-timor-date",
      }),
    ]);
  });
});
