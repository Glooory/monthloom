import { describe, it, expect } from "vitest";
import { createFullYearCalendarSet } from "./calendarSet";

describe("createFullYearCalendarSet", () => {
  it("generates exactly 13 pages, 13 unique main calendars, and 15 unique mini calendars for 2027", () => {
    const calendarSet = createFullYearCalendarSet({ targetYear: 2027 });

    expect(calendarSet.pages).toHaveLength(13);
    expect(calendarSet.mainCalendars.size).toBe(13);
    expect(calendarSet.miniCalendars.size).toBe(15);

    // Verify Main keys: 2027-1 .. 2027-12, 2028-1
    for (let m = 1; m <= 12; m++) {
      expect(calendarSet.mainCalendars.has(`2027-${m}`)).toBe(true);
    }
    expect(calendarSet.mainCalendars.has("2028-1")).toBe(true);

    // Verify Mini keys: 2026-12, 2027-1 .. 2027-12, 2028-1, 2028-2
    expect(calendarSet.miniCalendars.has("2026-12")).toBe(true);
    for (let m = 1; m <= 12; m++) {
      expect(calendarSet.miniCalendars.has(`2027-${m}`)).toBe(true);
    }
    expect(calendarSet.miniCalendars.has("2028-1")).toBe(true);
    expect(calendarSet.miniCalendars.has("2028-2")).toBe(true);

    // Verify every page's main and mini keys are present in maps
    for (const page of calendarSet.pages) {
      const mainKey = `${page.mainMonth.year}-${page.mainMonth.month}` as const;
      const prevKey = `${page.previousMiniMonth.year}-${page.previousMiniMonth.month}` as const;
      const nextKey = `${page.nextMiniMonth.year}-${page.nextMiniMonth.month}` as const;

      expect(calendarSet.mainCalendars.has(mainKey)).toBe(true);
      expect(calendarSet.miniCalendars.has(prevKey)).toBe(true);
      expect(calendarSet.miniCalendars.has(nextKey)).toBe(true);
    }
  });

  it("reuses the same CalendarMonth object when keys match", () => {
    const calendarSet = createFullYearCalendarSet({ targetYear: 2027 });
    const page0 = calendarSet.pages[0]; // Next mini is 2027-2
    const page2 = calendarSet.pages[2]; // Prev mini is 2027-2

    const mini2027_2 = calendarSet.miniCalendars.get("2027-2");
    expect(mini2027_2).toBeDefined();

    // Verify both page0's next mini and page2's prev mini refer to the same mini month key
    const page0NextKey = `${page0.nextMiniMonth.year}-${page0.nextMiniMonth.month}`;
    const page2PrevKey = `${page2.previousMiniMonth.year}-${page2.previousMiniMonth.month}`;
    expect(page0NextKey).toBe("2027-2");
    expect(page2PrevKey).toBe("2027-2");
  });
});
