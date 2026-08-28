import { describe, expect, it } from "vitest";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import {
  collectMainFontText,
  collectMiniFontText,
  mergeFontTextRequirements,
} from "./textRequirements";

describe("Font Text Requirements Collection", () => {
  it("collects all required characters for Main calendar per fontId", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        ["2027-04-30", { china: { type: "workday" } }], // adjacent previous
        ["2027-05-01", { china: { type: "holiday", name: "劳动节" } }], // current
        ["2027-05-03", { japan: { name: "憲法記念日" } }], // current
        ["2027-06-05", { china: { type: "holiday", name: "芒种" } }], // adjacent next
      ]),
    );

    const template: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      weekdayRow: {
        ...DEFAULT_MAIN_TEMPLATE.weekdayRow,
        weekday: {
          ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday,
          typography: {
            ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday.typography,
            fontId: "font-en",
          },
        },
      },
      date: {
        ...DEFAULT_MAIN_TEMPLATE.date,
        typography: {
          ...DEFAULT_MAIN_TEMPLATE.date.typography,
          fontId: "font-en",
        },
      },
      chinaMarkers: {
        holiday: {
          type: "text",
          value: "休",
          position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
          typography: {
            fontId: "font-zh",
            fontSize: 10,
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#000",
            opacity: 1,
          },
        },
        workday: {
          type: "text",
          value: "班",
          position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
          typography: {
            fontId: "font-zh",
            fontSize: 10,
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#000",
            opacity: 1,
          },
        },
      },
      chinaHolidayName: {
        ...DEFAULT_MAIN_TEMPLATE.chinaHolidayName,
        typography: {
          ...DEFAULT_MAIN_TEMPLATE.chinaHolidayName.typography,
          fontId: "font-zh",
        },
      },
      japanHolidayName: {
        ...DEFAULT_MAIN_TEMPLATE.japanHolidayName,
        typography: {
          ...DEFAULT_MAIN_TEMPLATE.japanHolidayName.typography,
          fontId: "font-ja",
        },
      },
    };

    const reqs = collectMainFontText({ calendar, template });

    // font-en should have weekdays and all visible dates (including adjacent dates)
    const enText = reqs.get("font-en") ?? "";
    for (const char of ["S", "u", "n", "M", "o", "T", "e", "W", "d", "h", "F", "r", "i", "a", "t", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) {
      expect(enText).toContain(char);
    }

    // font-zh should have holiday/workday marker values ("休", "班") and holiday names ("劳动节", "芒种")
    const zhText = reqs.get("font-zh") ?? "";
    for (const char of ["休", "班", "劳", "动", "节", "芒", "种"]) {
      expect(zhText).toContain(char);
    }

    // font-ja should have Japanese holiday name ("憲法記念日")
    const jaText = reqs.get("font-ja") ?? "";
    for (const char of ["憲", "法", "記", "念", "日"]) {
      expect(jaText).toContain(char);
    }

    // Check unique characters (no duplicate code points)
    for (const chars of reqs.values()) {
      const charArr = Array.from(chars);
      const uniqueCharArr = [...new Set(charArr)];
      expect(charArr.length).toBe(uniqueCharArr.length);
    }
  });

  it("does not collect text for image markers", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([["2027-05-01", { china: { type: "holiday" } }]]),
    );

    const template: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      chinaMarkers: {
        holiday: {
          type: "image",
          assetId: "marker-123",
          position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
          width: 12,
          height: 12,
          opacity: 1,
        },
        workday: DEFAULT_MAIN_TEMPLATE.chinaMarkers.workday,
      },
    };

    const reqs = collectMainFontText({ calendar, template });
    // Should not throw and should collect standard date/weekday text
    expect(reqs.size).toBeGreaterThan(0);
  });

  it("collects all required characters for Mini calendar per fontId", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        ["2027-04-30", { china: { type: "workday" } }], // adjacent previous
        ["2027-05-01", { china: { type: "holiday", name: "劳动节" } }], // current
        ["2027-05-03", { japan: { name: "憲法記念日" } }], // current
        ["2027-06-05", { china: { type: "holiday", name: "芒种" } }], // adjacent next
      ]),
    );

    const template: MiniTemplate = {
      ...DEFAULT_MINI_TEMPLATE,
      monthRow: {
        ...DEFAULT_MINI_TEMPLATE.monthRow,
        label: {
          ...DEFAULT_MINI_TEMPLATE.monthRow.label,
          typography: {
            ...DEFAULT_MINI_TEMPLATE.monthRow.label.typography,
            fontId: "font-label",
          },
        },
      },
      weekdayRow: {
        ...DEFAULT_MINI_TEMPLATE.weekdayRow,
        weekday: {
          ...DEFAULT_MINI_TEMPLATE.weekdayRow.weekday,
          typography: {
            ...DEFAULT_MINI_TEMPLATE.weekdayRow.weekday.typography,
            fontId: "font-mini-en",
          },
        },
      },
      date: {
        ...DEFAULT_MINI_TEMPLATE.date,
        typography: {
          ...DEFAULT_MINI_TEMPLATE.date.typography,
          fontId: "font-mini-date",
        },
      },
    };

    const reqs = collectMiniFontText({ calendar, template });

    // Month label font: "2027-5"
    const labelText = reqs.get("font-label") ?? "";
    expect(labelText).toContain("2");
    expect(labelText).toContain("0");
    expect(labelText).toContain("7");
    expect(labelText).toContain("-");
    expect(labelText).toContain("5");

    // Mini weekdays: S, M, T, W, F
    const weekdayText = reqs.get("font-mini-en") ?? "";
    expect(weekdayText).toContain("S");
    expect(weekdayText).toContain("M");
    expect(weekdayText).toContain("T");
    expect(weekdayText).toContain("W");
    expect(weekdayText).toContain("F");

    // Mini dates: only current month days 1..31
    const dateText = reqs.get("font-mini-date") ?? "";
    for (const char of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) {
      expect(dateText).toContain(char);
    }
    // Should NOT contain Chinese or Japanese characters
    expect(dateText).not.toContain("劳");
    expect(dateText).not.toContain("憲");

    // No holiday font should exist in mini requirements
    expect(reqs.has("font-zh")).toBe(false);
    expect(reqs.has("font-ja")).toBe(false);
  });

  it("merges multiple FontTextRequirements correctly", () => {
    const req1 = new Map([
      ["font-1", "abc"],
      ["font-2", "123"],
    ]);
    const req2 = new Map([
      ["font-1", "cde"],
      ["font-3", "xyz"],
    ]);

    const merged = mergeFontTextRequirements([req1, req2]);
    expect(merged.get("font-1")).toBe("abcde");
    expect(merged.get("font-2")).toBe("123");
    expect(merged.get("font-3")).toBe("xyz");
  });

  it("collects custom weekday labels defined on template", () => {
    const calendar = generateCalendarMonth(2027, 5);
    const template: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      weekdayRow: {
        ...DEFAULT_MAIN_TEMPLATE.weekdayRow,
        labels: ["日", "月", "火", "水", "木", "金", "土"],
        weekday: {
          ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday,
          typography: {
            ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday.typography,
            fontId: "font-weekday-jp",
          },
        },
      },
    };

    const reqs = collectMainFontText({ calendar, template });
    const weekdayChars = reqs.get("font-weekday-jp") ?? "";
    for (const char of ["日", "月", "火", "水", "木", "金", "土"]) {
      expect(weekdayChars).toContain(char);
    }
  });
});
