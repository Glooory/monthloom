import type { CalendarMonth } from "../../domain/calendar/types";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { FontTextRequirements } from "./types";

const DEFAULT_MAIN_WEEKDAYS: readonly string[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const DEFAULT_MINI_WEEKDAYS: readonly string[] = ["S", "M", "T", "W", "T", "F", "S"];

function uniqueCharacters(text: string): string {
  return [...new Set(Array.from(text))].join("");
}

function appendText(map: Map<string, string>, fontId: string, text: string): void {
  if (!fontId || !text) return;
  const existing = map.get(fontId) ?? "";
  map.set(fontId, existing + text);
}

export function collectMainFontText(args: {
  calendar: CalendarMonth;
  template: MainTemplate;
  weekdays?: readonly string[];
}): FontTextRequirements {
  const { calendar, template, weekdays = DEFAULT_MAIN_WEEKDAYS } = args;
  const rawMap = new Map<string, string>();

  // 1. Weekday row
  for (const w of weekdays) {
    appendText(rawMap, template.weekdayRow.weekday.typography.fontId, w);
  }

  // 2. All visible date cells (both current month and adjacent days)
  for (const week of calendar.weeks) {
    for (const cellData of week) {
      // Date number
      appendText(rawMap, template.date.typography.fontId, String(cellData.date.day));

      // China marker (if text type)
      if (cellData.holiday?.china?.type) {
        const marker =
          cellData.holiday.china.type === "holiday"
            ? template.chinaMarkers.holiday
            : template.chinaMarkers.workday;

        if (marker.type === "text") {
          appendText(rawMap, marker.typography.fontId, marker.value);
        }
      }

      // China holiday name
      if (cellData.holiday?.china?.name) {
        appendText(
          rawMap,
          template.chinaHolidayName.typography.fontId,
          cellData.holiday.china.name,
        );
      }

      // Japan holiday name
      if (cellData.holiday?.japan?.name) {
        appendText(
          rawMap,
          template.japanHolidayName.typography.fontId,
          cellData.holiday.japan.name,
        );
      }
    }
  }

  const result = new Map<string, string>();
  for (const [fontId, str] of rawMap) {
    result.set(fontId, uniqueCharacters(str));
  }
  return result;
}

export function collectMiniFontText(args: {
  calendar: CalendarMonth;
  template: MiniTemplate;
  weekdays?: readonly string[];
}): FontTextRequirements {
  const { calendar, template, weekdays = DEFAULT_MINI_WEEKDAYS } = args;
  const rawMap = new Map<string, string>();

  // 1. Month label: YYYY-M
  const monthLabel = `${calendar.year}-${calendar.month}`;
  appendText(rawMap, template.monthRow.label.typography.fontId, monthLabel);

  // 2. Weekdays
  for (const w of weekdays) {
    appendText(rawMap, template.weekdayRow.weekday.typography.fontId, w);
  }

  // 3. Current month date cells only
  for (const week of calendar.weeks) {
    for (const cellData of week) {
      if (cellData.inCurrentMonth) {
        appendText(rawMap, template.date.typography.fontId, String(cellData.date.day));
      }
    }
  }

  const result = new Map<string, string>();
  for (const [fontId, str] of rawMap) {
    result.set(fontId, uniqueCharacters(str));
  }
  return result;
}

export function mergeFontTextRequirements(
  requirements: readonly FontTextRequirements[],
): FontTextRequirements {
  const rawMap = new Map<string, string>();
  for (const req of requirements) {
    for (const [fontId, chars] of req) {
      const existing = rawMap.get(fontId) ?? "";
      rawMap.set(fontId, existing + chars);
    }
  }

  const result = new Map<string, string>();
  for (const [fontId, str] of rawMap) {
    result.set(fontId, uniqueCharacters(str));
  }
  return result;
}
