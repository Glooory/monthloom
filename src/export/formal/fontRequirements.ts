import type { HolidayLayer } from "../../domain/template/holidayLayer";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import {
  collectMainFontText,
  collectMiniFontText,
  mergeFontTextRequirements,
} from "../../resources/fonts/textRequirements";
import type { FontTextRequirements } from "../../resources/fonts/types";
import type { FormalExportCalendarSet } from "./types";

export function collectFormalExportFontRequirements(args: {
  calendarSet: FormalExportCalendarSet;
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  holidayLayers?: readonly HolidayLayer[];
}): FontTextRequirements {
  const { calendarSet, mainTemplate, miniTemplate, holidayLayers } = args;

  const requirementsList: FontTextRequirements[] = [];

  // Collect from 13 Main calendars
  for (const calendar of calendarSet.mainCalendars.values()) {
    requirementsList.push(
      collectMainFontText({
        calendar,
        template: mainTemplate,
        holidayLayers,
      }),
    );
  }

  // Collect from 15 Mini calendars
  for (const calendar of calendarSet.miniCalendars.values()) {
    requirementsList.push(
      collectMiniFontText({
        calendar,
        template: miniTemplate,
        holidayLayers,
      }),
    );
  }

  return mergeFontTextRequirements(requirementsList);
}
