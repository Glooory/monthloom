import { describe, expect, it } from "vitest";
import type { CalendarCell } from "../../domain/calendar/types";
import { type CalendarColors, resolveDateColor } from "./colorRules";

describe("Calendar Date Color Priority", () => {
  const colors: CalendarColors = {
    default: "#1F2937",
    sunday: "#DC2626",
    saturday: "#2563EB",
    japanHoliday: "#9333EA",
  };

  function createCell(partial: Partial<CalendarCell> = {}): CalendarCell {
    return {
      date: { year: 2027, month: 5, day: 10 },
      dayOfWeek: 1, // Monday
      inCurrentMonth: true,
      ...partial,
    };
  }

  it("returns default color for regular weekdays", () => {
    const cell = createCell({ dayOfWeek: 1 });
    expect(resolveDateColor(cell, colors)).toBe("#1F2937");
  });

  it("returns sunday color for Sunday", () => {
    const cell = createCell({ dayOfWeek: 0 });
    expect(resolveDateColor(cell, colors)).toBe("#DC2626");
  });

  it("returns saturday color for Saturday", () => {
    const cell = createCell({ dayOfWeek: 6 });
    expect(resolveDateColor(cell, colors)).toBe("#2563EB");
  });

  it("returns japanHoliday color when Japanese holiday is present on weekday, Saturday, or Sunday", () => {
    const weekdayHoliday = createCell({
      dayOfWeek: 3,
      holiday: { japan: { name: "憲法記念日" } },
    });
    expect(resolveDateColor(weekdayHoliday, colors)).toBe("#9333EA");

    const saturdayHoliday = createCell({
      dayOfWeek: 6,
      holiday: { japan: { name: "みどりの日" } },
    });
    expect(resolveDateColor(saturdayHoliday, colors)).toBe("#9333EA");

    const sundayHoliday = createCell({
      dayOfWeek: 0,
      holiday: { japan: { name: "こどもの日" } },
    });
    expect(resolveDateColor(sundayHoliday, colors)).toBe("#9333EA");
  });

  it("does not let China holiday or workday change date text color", () => {
    const chinaHolidayWeekday = createCell({
      dayOfWeek: 1,
      holiday: { china: { type: "holiday", name: "端午节" } },
    });
    expect(resolveDateColor(chinaHolidayWeekday, colors)).toBe("#1F2937");

    const chinaWorkdaySunday = createCell({
      dayOfWeek: 0,
      holiday: { china: { type: "workday" } },
    });
    expect(resolveDateColor(chinaWorkdaySunday, colors)).toBe("#DC2626");
  });
});
