import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { HolidayLayer } from "../../domain/template/holidayLayer";
import {
  collectMainFontText,
  collectMiniFontText,
  mergeFontTextRequirements,
} from "../../resources/fonts/textRequirements";
import type { FontTextRequirements } from "../../resources/fonts/types";
import type { FullYearCalendarSet } from "./calendarSet";

export function collectFullYearPreviewFontRequirements(args: {
  calendarSet: FullYearCalendarSet;
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  holidayLayers?: readonly HolidayLayer[];
}): FontTextRequirements {
  const { calendarSet, mainTemplate, miniTemplate, holidayLayers } = args;

  const requirementsList: FontTextRequirements[] = [];

  // Collect from all 13 unique Main calendars
  for (const calendar of calendarSet.mainCalendars.values()) {
    requirementsList.push(
      collectMainFontText({
        calendar,
        template: mainTemplate,
        holidayLayers,
      }),
    );
  }

  // Collect from all 15 unique Mini calendars
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
