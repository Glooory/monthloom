import { describe, it, expect } from "vitest";
import { getFullYearPageDefinitions } from "./fullYearPages";
import { getMainMonths, getMiniMonths } from "../calendar/monthSequence";

describe("getFullYearPageDefinitions", () => {
  it("returns exactly 13 pages for target year 2027", () => {
    const pages = getFullYearPageDefinitions(2027);
    expect(pages).toHaveLength(13);

    // Page 0: 2027-1
    expect(pages[0]).toEqual({
      pageIndex: 0,
      label: "2027-1",
      mainMonth: { year: 2027, month: 1 },
      previousMiniMonth: { year: 2026, month: 12 },
      nextMiniMonth: { year: 2027, month: 2 },
    });

    // Page 1: 2027-2
    expect(pages[1]).toEqual({
      pageIndex: 1,
      label: "2027-2",
      mainMonth: { year: 2027, month: 2 },
      previousMiniMonth: { year: 2027, month: 1 },
      nextMiniMonth: { year: 2027, month: 3 },
    });

    // Page 11: 2027-12
    expect(pages[11]).toEqual({
      pageIndex: 11,
      label: "2027-12",
      mainMonth: { year: 2027, month: 12 },
      previousMiniMonth: { year: 2027, month: 11 },
      nextMiniMonth: { year: 2028, month: 1 },
    });

    // Page 12: 2028-1
    expect(pages[12]).toEqual({
      pageIndex: 12,
      label: "2028-1",
      mainMonth: { year: 2028, month: 1 },
      previousMiniMonth: { year: 2027, month: 12 },
      nextMiniMonth: { year: 2028, month: 2 },
    });
  });

  it("ensures preview-only February does not alter formal Phase 1 mini month scope", () => {
    const pages = getFullYearPageDefinitions(2027);
    const lastPage = pages[12];
    expect(lastPage.nextMiniMonth).toEqual({ year: 2028, month: 2 });

    const formalMainMonths = getMainMonths(2027);
    expect(formalMainMonths).toHaveLength(13);
    expect(formalMainMonths[0]).toEqual({ year: 2027, month: 1 });
    expect(formalMainMonths[12]).toEqual({ year: 2028, month: 1 });

    const formalMiniMonths = getMiniMonths(2027);
    expect(formalMiniMonths).toHaveLength(14);
    expect(formalMiniMonths[0]).toEqual({ year: 2026, month: 12 });
    expect(formalMiniMonths[13]).toEqual({ year: 2028, month: 1 });
    expect(formalMiniMonths.some((m) => m.year === 2028 && m.month === 2)).toBe(false);
  });
});
