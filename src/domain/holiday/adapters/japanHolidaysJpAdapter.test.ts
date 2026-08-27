import { describe, expect, it } from "vitest";
import { parseJapanHolidaysJp } from "./japanHolidaysJpAdapter";

describe("parseJapanHolidaysJp", () => {
  it("normalizes date-name records", () => {
    const result = parseJapanHolidaysJp({
      "2027-01-01": "元日",
      "2027-05-03": "憲法記念日",
    });

    expect(result.source).toBe("japan-holidays-jp");
    expect(result.entries).toEqual([
      {
        date: { year: 2027, month: 1, day: 1 },
        info: { japan: { name: "元日" } },
      },
      {
        date: { year: 2027, month: 5, day: 3 },
        info: { japan: { name: "憲法記念日" } },
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

  it("returns an error diagnostic for malformed source data", () => {
    const result = parseJapanHolidaysJp({
      "2027-01-01": 123,
    });

    expect(result.entries).toEqual([]);
    expect(result.coverage.ranges).toEqual([]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        level: "error",
        code: "invalid-japan-holidays-jp",
      }),
    ]);
  });

  it("returns an error diagnostic for invalid date key", () => {
    const result = parseJapanHolidaysJp({
      "2027-02-29": "存在しない日",
    });

    expect(result.entries).toEqual([]);
    expect(result.coverage.ranges).toEqual([]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        level: "error",
        code: "invalid-japan-holiday-date",
      }),
    ]);
  });
});
