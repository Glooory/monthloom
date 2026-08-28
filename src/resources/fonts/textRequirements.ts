import type { CalendarMonth } from "../../domain/calendar/types";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { HolidayLayer } from "../../domain/template/holidayLayer";
import {
  DEFAULT_MAIN_WEEKDAYS,
  DEFAULT_MINI_WEEKDAYS,
} from "../../domain/template/defaults";
import type { FontTextRequirements } from "./types";

function uniqueCharacters(text: string): string {
  return [...new Set(Array.from(text))].join("");
}

function appendText(
  map: Map<string, string>,
  fontId: string,
  text: string,
): void {
  if (!fontId || !text) return;
  const existing = map.get(fontId) ?? "";
  map.set(fontId, existing + text);
}

export function collectMainFontText(args: {
  calendar: CalendarMonth;
  template: MainTemplate;
  weekdays?: readonly string[];
  holidayLayers?: readonly HolidayLayer[];
}): FontTextRequirements {
  const { calendar, template, holidayLayers } = args;
  const weekdays =
    args.weekdays ?? template.weekdayRow.labels ?? DEFAULT_MAIN_WEEKDAYS;
  const rawMap = new Map<string, string>();

  // 1. Weekday row
  for (const w of weekdays) {
    appendText(rawMap, template.weekdayRow.weekday.typography.fontId, w);
  }

  // 2. All visible date cells (both current month and adjacent days if enabled)
  for (const week of calendar.weeks) {
    for (const cellData of week) {
      if (!cellData.inCurrentMonth && !template.showAdjacentDays) {
        continue;
      }

      // Date number
      appendText(
        rawMap,
        template.date.typography.fontId,
        String(cellData.date.day),
      );

      // Dynamic Holiday Layers
      if (cellData.holiday?.occurrences && holidayLayers) {
        for (const occurrence of cellData.holiday.occurrences) {
          const layer = holidayLayers.find((l) => l.id === occurrence.layerId);
          if (!layer || !layer.enabled) continue;

          // Holiday name
          if (
            occurrence.type === "holiday" &&
            occurrence.name &&
            layer.main.showName
          ) {
            appendText(
              rawMap,
              layer.main.name.typography.fontId,
              occurrence.name,
            );
          }

          // Marker
          const markerConfig =
            occurrence.type === "holiday"
              ? layer.main.holidayMarker
              : layer.main.workdayMarker;

          if (
            markerConfig.enabled &&
            markerConfig.marker.type === "text" &&
            markerConfig.marker.value
          ) {
            appendText(
              rawMap,
              markerConfig.marker.typography.fontId,
              markerConfig.marker.value,
            );
          }
        }
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
  holidayLayers?: readonly HolidayLayer[];
}): FontTextRequirements {
  const { calendar, template, holidayLayers } = args;
  const weekdays =
    args.weekdays ?? template.weekdayRow.labels ?? DEFAULT_MINI_WEEKDAYS;
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
        appendText(
          rawMap,
          template.date.typography.fontId,
          String(cellData.date.day),
        );

        // Dynamic Holiday Layer markers
        if (cellData.holiday?.occurrences && holidayLayers) {
          for (const occurrence of cellData.holiday.occurrences) {
            const layer = holidayLayers.find(
              (l) => l.id === occurrence.layerId,
            );
            if (!layer || !layer.enabled) continue;

            const markerConfig =
              occurrence.type === "holiday"
                ? layer.mini.holidayMarker
                : layer.mini.workdayMarker;

            if (
              markerConfig.enabled &&
              markerConfig.marker.type === "text" &&
              markerConfig.marker.value
            ) {
              appendText(
                rawMap,
                markerConfig.marker.typography.fontId,
                markerConfig.marker.value,
              );
            }
          }
        }
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
