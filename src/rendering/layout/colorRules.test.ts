import { describe, expect, it } from "vitest";
import type { CalendarCell } from "../../domain/calendar/types";
import { type CalendarColors, resolveDateColor } from "./colorRules";

describe("Calendar Date Color Priority", () => {
  const colors: CalendarColors = {
    default: "#1F2937",
    sunday: "#DC2626",
    saturday: "#2563EB",
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

  it("prioritizes holiday date color when resolved for Main", () => {
    const cell = createCell({
      dayOfWeek: 3,
      holiday: {
        occurrences: [],
        mainDateColor: "#9333EA",
      },
    });
    expect(resolveDateColor(cell, colors, "main")).toBe("#9333EA");
  });

  it("prioritizes holiday date color when resolved for Mini", () => {
    const cell = createCell({
      dayOfWeek: 0,
      holiday: {
        occurrences: [],
        miniDateColor: "#059669",
      },
    });
    expect(resolveDateColor(cell, colors, "mini")).toBe("#059669");
    expect(resolveDateColor(cell, colors, "main")).toBe("#DC2626"); // Sunday default for main
  });

  it("falls back to standard day colors when holiday color is not set", () => {
    const cell = createCell({
      dayOfWeek: 0,
      holiday: {
        occurrences: [
          {
            layerId: "cn",
            calendarId: "builtin-cn",
            type: "holiday",
            name: "端午节",
          },
        ],
      },
    });
    expect(resolveDateColor(cell, colors, "main")).toBe("#DC2626");
  });
});
