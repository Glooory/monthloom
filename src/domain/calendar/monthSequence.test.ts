import { describe, expect, it } from "vitest";
import {
  calculateRequiredHolidayRange,
  getMainMonths,
  getMiniMonths,
} from "./monthSequence";

describe("monthSequence", () => {
  it("returns the 13 Main months for a target year", () => {
    const mainMonths = getMainMonths(2027);

    expect(mainMonths).toHaveLength(13);
    expect(mainMonths).toEqual([
      { year: 2027, month: 1 },
      { year: 2027, month: 2 },
      { year: 2027, month: 3 },
      { year: 2027, month: 4 },
      { year: 2027, month: 5 },
      { year: 2027, month: 6 },
      { year: 2027, month: 7 },
      { year: 2027, month: 8 },
      { year: 2027, month: 9 },
      { year: 2027, month: 10 },
      { year: 2027, month: 11 },
      { year: 2027, month: 12 },
      { year: 2028, month: 1 },
    ]);
  });

  it("returns the 15 formal Mini months for a target year", () => {
    const miniMonths = getMiniMonths(2027);

    expect(miniMonths).toHaveLength(15);
    expect(miniMonths).toEqual([
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
      { year: 2027, month: 2 },
      { year: 2027, month: 3 },
      { year: 2027, month: 4 },
      { year: 2027, month: 5 },
      { year: 2027, month: 6 },
      { year: 2027, month: 7 },
      { year: 2027, month: 8 },
      { year: 2027, month: 9 },
      { year: 2027, month: 10 },
      { year: 2027, month: 11 },
      { year: 2027, month: 12 },
      { year: 2028, month: 1 },
      { year: 2028, month: 2 },
    ]);
  });

  it("calculates the required holiday date range for 2027 (including leap-year 2028-02)", () => {
    expect(calculateRequiredHolidayRange(2027)).toEqual({
      start: { year: 2026, month: 12, day: 1 },
      end: { year: 2028, month: 2, day: 29 },
    });
  });

  it("calculates the required holiday date range for 2026 (non-leap next year)", () => {
    expect(calculateRequiredHolidayRange(2026)).toEqual({
      start: { year: 2025, month: 12, day: 1 },
      end: { year: 2027, month: 2, day: 28 },
    });
  });

  it("locks repository-wide formal scope: 13 Main + 15 Mini = 28 total with Y+1 February included", () => {
    const mainMonths = getMainMonths(2027);
    const miniMonths = getMiniMonths(2027);

    expect(mainMonths).toHaveLength(13);
    expect(miniMonths).toHaveLength(15);
    expect(mainMonths.length + miniMonths.length).toBe(28);

    expect(miniMonths.some((m) => m.year === 2028 && m.month === 2)).toBe(true);
  });
});
