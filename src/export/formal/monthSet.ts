import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import { getMainMonths, getMiniMonths } from "../../domain/calendar/monthSequence";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { HolidayIndex } from "../../domain/holiday/types";
import type { FormalExportCalendarSet } from "./types";

export function createFormalExportCalendarSet(args: {
  targetYear: number;
  holidayIndex?: HolidayIndex;
  mainStartOfWeek?: 0 | 1;
  miniStartOfWeek?: 0 | 1;
}): FormalExportCalendarSet {
  const { targetYear, holidayIndex, mainStartOfWeek = 0, miniStartOfWeek = 0 } = args;

  const mainCalendars = new Map<string, CalendarMonth>();
  const miniCalendars = new Map<string, CalendarMonth>();

  // 1. Exactly 13 Main months
  for (const ym of getMainMonths(targetYear)) {
    const key = `${ym.year}-${ym.month}`;
    mainCalendars.set(
      key,
      generateCalendarMonth(ym.year, ym.month, holidayIndex, mainStartOfWeek),
    );
  }

  // 2. Exactly 15 Mini months (including Y-1 Dec, Y 1..12, Y+1 Jan, Y+1 Feb)
  for (const ym of getMiniMonths(targetYear)) {
    const key = `${ym.year}-${ym.month}`;
    miniCalendars.set(
      key,
      generateCalendarMonth(ym.year, ym.month, holidayIndex, miniStartOfWeek),
    );
  }

  return {
    mainCalendars,
    miniCalendars,
  };
}
