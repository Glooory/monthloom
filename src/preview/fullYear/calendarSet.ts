import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { HolidayIndex } from "../../domain/holiday/types";
import {
  getFullYearPageDefinitions,
  type FullYearPageDefinition,
} from "../../domain/pagePreview/fullYearPages";

export type CalendarKey = `${number}-${number}`;

export type FullYearCalendarSet = Readonly<{
  pages: readonly FullYearPageDefinition[];
  mainCalendars: ReadonlyMap<CalendarKey, CalendarMonth>;
  miniCalendars: ReadonlyMap<CalendarKey, CalendarMonth>;
}>;

export function createFullYearCalendarSet(args: {
  targetYear: number;
  holidayIndex?: HolidayIndex;
}): FullYearCalendarSet {
  const { targetYear, holidayIndex } = args;
  const pages = getFullYearPageDefinitions(targetYear);

  const mainCalendars = new Map<CalendarKey, CalendarMonth>();
  const miniCalendars = new Map<CalendarKey, CalendarMonth>();

  for (const page of pages) {
    const mainKey: CalendarKey = `${page.mainMonth.year}-${page.mainMonth.month}`;
    if (!mainCalendars.has(mainKey)) {
      mainCalendars.set(
        mainKey,
        generateCalendarMonth(page.mainMonth.year, page.mainMonth.month, holidayIndex),
      );
    }

    const prevKey: CalendarKey = `${page.previousMiniMonth.year}-${page.previousMiniMonth.month}`;
    if (!miniCalendars.has(prevKey)) {
      miniCalendars.set(
        prevKey,
        generateCalendarMonth(
          page.previousMiniMonth.year,
          page.previousMiniMonth.month,
          holidayIndex,
        ),
      );
    }

    const nextKey: CalendarKey = `${page.nextMiniMonth.year}-${page.nextMiniMonth.month}`;
    if (!miniCalendars.has(nextKey)) {
      miniCalendars.set(
        nextKey,
        generateCalendarMonth(
          page.nextMiniMonth.year,
          page.nextMiniMonth.month,
          holidayIndex,
        ),
      );
    }
  }

  return {
    pages,
    mainCalendars,
    miniCalendars,
  };
}
