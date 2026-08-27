import { describe, it, expect } from "vitest";
import { createFullYearCalendarSet } from "./calendarSet";
import { collectFullYearPreviewFontRequirements } from "./fontRequirements";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";

describe("collectFullYearPreviewFontRequirements", () => {
  it("merges font requirements across all 13 main calendars and 15 unique mini calendars", () => {
    const calendarSet = createFullYearCalendarSet({ targetYear: 2027 });
    const requirements = collectFullYearPreviewFontRequirements({
      calendarSet,
      mainTemplate: DEFAULT_MAIN_TEMPLATE,
      miniTemplate: DEFAULT_MINI_TEMPLATE,
    });

    expect(requirements).toBeInstanceOf(Map);
    expect(requirements.size).toBeGreaterThan(0);

    // Date typography fontId should have digits 0-9
    const dateFontId = DEFAULT_MAIN_TEMPLATE.date.typography.fontId;
    const dateChars = requirements.get(dateFontId) ?? "";
    for (let i = 0; i <= 9; i++) {
      expect(dateChars).toContain(String(i));
    }

    // Mini month label should contain year chars '2026', '2027', '2028' and hyphen
    const miniLabelFontId = DEFAULT_MINI_TEMPLATE.monthRow.label.typography.fontId;
    const miniLabelChars = requirements.get(miniLabelFontId) ?? "";
    expect(miniLabelChars).toContain("2");
    expect(miniLabelChars).toContain("0");
    expect(miniLabelChars).toContain("6");
    expect(miniLabelChars).toContain("7");
    expect(miniLabelChars).toContain("8");
    expect(miniLabelChars).toContain("-");
  });
});
