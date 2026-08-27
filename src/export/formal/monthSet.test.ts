import { describe, it, expect } from "vitest";
import { createFormalExportCalendarSet } from "./monthSet";
import { collectFormalExportFontRequirements } from "./fontRequirements";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";

describe("Formal Export Month Set", () => {
  it("creates exactly 13 Main and 15 Mini calendars for 2027 (total 28)", () => {
    const calendarSet = createFormalExportCalendarSet({ targetYear: 2027 });

    expect(calendarSet.mainCalendars.size).toBe(13);
    expect(calendarSet.miniCalendars.size).toBe(15);
    expect(calendarSet.mainCalendars.size + calendarSet.miniCalendars.size).toBe(28);

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
  });

  it("merges font requirements across all 28 formal calendars", () => {
    const calendarSet = createFormalExportCalendarSet({ targetYear: 2027 });
    const fontReqs = collectFormalExportFontRequirements({
      calendarSet,
      mainTemplate: DEFAULT_MAIN_TEMPLATE,
      miniTemplate: DEFAULT_MINI_TEMPLATE,
    });

    expect(fontReqs.size).toBeGreaterThan(0);
  });
});
