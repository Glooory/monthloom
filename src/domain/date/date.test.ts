import { describe, expect, it } from "vitest";
import {
  addDays,
  compareDate,
  dayOfWeek,
  daysInMonth,
  isValidLocalDate,
  parseISODate,
  toISODate,
} from "./date";

describe("daysInMonth", () => {
  it("handles leap years", () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it("rejects invalid months", () => {
    expect(() => daysInMonth(2027, 0)).toThrow(RangeError);
    expect(() => daysInMonth(2027, 13)).toThrow(RangeError);
  });
});

describe("LocalDate utilities", () => {
  it("validates real calendar dates", () => {
    expect(isValidLocalDate({ year: 2028, month: 2, day: 29 })).toBe(true);
    expect(isValidLocalDate({ year: 2027, month: 2, day: 29 })).toBe(false);
    expect(isValidLocalDate({ year: 2027, month: 13, day: 1 })).toBe(false);
  });

  it("uses Sunday as day 0", () => {
    expect(dayOfWeek({ year: 2027, month: 1, day: 3 })).toBe(0);
    expect(dayOfWeek({ year: 2027, month: 1, day: 9 })).toBe(6);
  });

  it("crosses month and year boundaries without local timezone behavior", () => {
    expect(addDays({ year: 2027, month: 1, day: 1 }, -1)).toEqual({
      year: 2026,
      month: 12,
      day: 31,
    });

    expect(addDays({ year: 2027, month: 12, day: 31 }, 1)).toEqual({
      year: 2028,
      month: 1,
      day: 1,
    });
  });

  it("formats ISO dates with zero-padded month and day", () => {
    expect(toISODate({ year: 2027, month: 5, day: 7 })).toBe("2027-05-07");
  });

  it("parses only strict valid YYYY-MM-DD values", () => {
    expect(parseISODate("2027-05-07")).toEqual({
      year: 2027,
      month: 5,
      day: 7,
    });

    expect(parseISODate("2027-5-7")).toBeNull();
    expect(parseISODate("2027-02-29")).toBeNull();
    expect(parseISODate("not-a-date")).toBeNull();
  });

  it("compares dates chronologically", () => {
    expect(
      compareDate(
        { year: 2027, month: 1, day: 1 },
        { year: 2027, month: 1, day: 2 },
      ),
    ).toBe(-1);

    expect(
      compareDate(
        { year: 2027, month: 1, day: 2 },
        { year: 2027, month: 1, day: 2 },
      ),
    ).toBe(0);
  });
});
