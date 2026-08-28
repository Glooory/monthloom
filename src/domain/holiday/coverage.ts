import { addDays, compareDate, toISODate } from "../date/date";
import type { DateRange, LocalDate } from "../date/types";
import type {
  HolidayCalendar,
  HolidayCoverage,
  HolidayDiagnostic,
} from "./types";

export function calculateRequiredHolidayRange(targetYear: number): DateRange {
  const nextYear = targetYear + 1;
  const isNextLeap =
    nextYear % 4 === 0 && (nextYear % 100 !== 0 || nextYear % 400 === 0);
  return {
    start: { year: targetYear - 1, month: 12, day: 1 },
    end: { year: nextYear, month: 2, day: isNextLeap ? 29 : 28 },
  };
}

export function isDateInConfirmedCoverage(
  date: LocalDate,
  coverageList: readonly HolidayCoverage[],
  calendarId: string,
): boolean {
  for (const cov of coverageList) {
    if (cov.calendarId !== calendarId || cov.status !== "confirmed") continue;
    if (compareDate(cov.start, date) <= 0 && compareDate(date, cov.end) <= 0) {
      return true;
    }
  }
  return false;
}

export function getUncoveredCalendarRanges(
  required: DateRange,
  coverageList: readonly HolidayCoverage[],
  calendarId: string,
): readonly DateRange[] {
  const gaps: DateRange[] = [];
  let cursor = required.start;
  let gapStart: LocalDate | null = null;
  let gapEnd: LocalDate | null = null;

  while (compareDate(cursor, required.end) <= 0) {
    if (!isDateInConfirmedCoverage(cursor, coverageList, calendarId)) {
      if (!gapStart) {
        gapStart = cursor;
      }
      gapEnd = cursor;
    } else {
      if (gapStart && gapEnd) {
        gaps.push({ start: gapStart, end: gapEnd });
        gapStart = null;
        gapEnd = null;
      }
    }
    cursor = addDays(cursor, 1);
  }

  if (gapStart && gapEnd) {
    gaps.push({ start: gapStart, end: gapEnd });
  }

  return gaps;
}

export function createCalendarCoverageDiagnostics(args: {
  calendar: HolidayCalendar;
  requiredRange: DateRange;
  coverage: readonly HolidayCoverage[];
}): readonly HolidayDiagnostic[] {
  const gaps = getUncoveredCalendarRanges(
    args.requiredRange,
    args.coverage,
    args.calendar.id,
  );
  return gaps.map((gap) => ({
    level: "warning",
    code: "holiday-coverage-gap",
    message: `${args.calendar.name} holiday data does not cover ${toISODate(gap.start)} through ${toISODate(gap.end)}.`,
  }));
}
