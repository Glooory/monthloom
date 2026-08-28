import { describe, expect, it } from "vitest";
import { normalizeChinaTimorHolidayYear } from "./chinaTimorHolidayAdapter";
import { BUILTIN_CHINA_CALENDAR_ID } from "../types";

describe("normalizeChinaTimorHolidayYear", () => {
  it("normalizes both holidays and makeup workdays into HolidayBaseUpdate", () => {
    const result = normalizeChinaTimorHolidayYear({
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

    expect(result.calendarId).toBe(BUILTIN_CHINA_CALENDAR_ID);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      date: { year: 2027, month: 1, day: 1 },
      type: "holiday",
      name: "元旦",
      source: "sync",
    });
    expect(result.records[1]).toMatchObject({
      date: { year: 2027, month: 2, day: 6 },
      type: "workday",
      name: "春节前补班",
      source: "sync",
    });

    expect(result.coverage).toEqual([
      expect.objectContaining({
        start: { year: 2027, month: 1, day: 1 },
        end: { year: 2027, month: 12, day: 31 },
        status: "confirmed",
      }),
    ]);
    expect(result.replacementRanges).toEqual([
      {
        start: { year: 2027, month: 1, day: 1 },
        end: { year: 2027, month: 12, day: 31 },
      },
    ]);
  });

  it("throws error for malformed source data", () => {
    expect(() =>
      normalizeChinaTimorHolidayYear({
        code: 0,
        holiday: {
          "01-01": {
            holiday: "yes",
            date: "2027-01-01",
          },
        },
      }),
    ).toThrow(/Malformed China Timor dataset/);
  });

  it("throws error when Timor response code is non-zero", () => {
    expect(() =>
      normalizeChinaTimorHolidayYear({
        code: -1,
        holiday: {},
      }),
    ).toThrow(/China Timor response returned error code/);
  });

  it("throws error for invalid date format", () => {
    expect(() =>
      normalizeChinaTimorHolidayYear({
        code: 0,
        holiday: {
          "01-01": {
            holiday: true,
            date: "invalid-date",
          },
        },
      }),
    ).toThrow(/Invalid date field in China Timor item/);
  });
});
