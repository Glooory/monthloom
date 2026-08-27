import { describe, expect, it } from "vitest";
import {
  calculateRequiredHolidayRange,
  getMainMonths,
  getMiniMonths,
  getPreviewExtraMiniMonths,
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

  it("returns the 14 formal Mini months for a target year", () => {
    const miniMonths = getMiniMonths(2027);

    expect(miniMonths).toHaveLength(14);
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
    ]);
  });

  it("returns the Preview-only extra Mini months", () => {
    const previewExtra = getPreviewExtraMiniMonths(2027);

    expect(previewExtra).toEqual([{ year: 2028, month: 2 }]);
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
});
