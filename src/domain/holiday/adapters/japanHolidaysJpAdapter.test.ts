import { describe, expect, it } from "vitest";
import { normalizeJapanHolidaysJp } from "./japanHolidaysJpAdapter";
import { BUILTIN_JAPAN_CALENDAR_ID } from "../types";

describe("normalizeJapanHolidaysJp", () => {
  it("normalizes date-name records into HolidayBaseUpdate", () => {
    const result = normalizeJapanHolidaysJp({
      "2027-01-01": "元日",
      "2027-05-03": "憲法記念日",
    });

    expect(result.calendarId).toBe(BUILTIN_JAPAN_CALENDAR_ID);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      date: { year: 2027, month: 1, day: 1 },
      type: "holiday",
      name: "元日",
      source: "sync",
    });
    expect(result.records[1]).toMatchObject({
      date: { year: 2027, month: 5, day: 3 },
      type: "holiday",
      name: "憲法記念日",
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
      normalizeJapanHolidaysJp({
        "2027-01-01": 123,
      }),
    ).toThrow(/Malformed Japan holidays dataset/);
  });

  it("throws error for invalid date key", () => {
    expect(() =>
      normalizeJapanHolidaysJp({
        "2027-02-29": "存在しない日",
      }),
    ).toThrow(/Invalid date key in Japan holidays data/);
  });
});
