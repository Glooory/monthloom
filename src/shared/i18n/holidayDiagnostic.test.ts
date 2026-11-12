import { describe, expect, it } from "vitest";
import { createCalendarCoverageDiagnostics } from "../../domain/holiday/coverage";
import { BUILTIN_CHINA_CALENDAR_ID } from "../../domain/holiday/types";
import { formatHolidayDiagnostic } from "./holidayDiagnostic";
import { en } from "./locales/en";
import { zh } from "./locales/zh";

describe("formatHolidayDiagnostic", () => {
  const [diagnostic] = createCalendarCoverageDiagnostics({
    calendar: { id: BUILTIN_CHINA_CALENDAR_ID, name: "中国公众假期", builtin: true, createdAt: "", updatedAt: "" },
    requiredRange: { start: { year: 2028, month: 1, day: 1 }, end: { year: 2028, month: 2, day: 29 } },
    coverage: [],
  });

  it("uses the selected language for the sentence and built-in calendar name", () => {
    expect(formatHolidayDiagnostic(diagnostic, zh)).toBe("中国公众假期数据未覆盖 2028-01-01 至 2028-02-29。");
    expect(formatHolidayDiagnostic(diagnostic, en)).toBe("China Public Holidays holiday data does not cover 2028-01-01 through 2028-02-29.");
  });

  it("preserves custom names and unrelated diagnostics", () => {
    const custom = { ...diagnostic, coverageGap: { ...diagnostic.coverageGap!, calendarId: "custom", calendarName: "My Calendar" } };
    expect(formatHolidayDiagnostic(custom, en)).toContain("My Calendar");
    expect(formatHolidayDiagnostic({ code: "other", level: "warning", message: "Details" }, zh)).toBe("Details");
  });
});
