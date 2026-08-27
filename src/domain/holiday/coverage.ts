import { addDays, compareDate, toISODate } from "../date/date";
import type { DateRange, LocalDate } from "../date/types";
import type {
  DateCoverage,
  HolidayDiagnostic,
  HolidaySource,
} from "./types";

export function isDateCovered(
  date: LocalDate,
  coverage: DateCoverage,
): boolean {
  for (const range of coverage.ranges) {
    if (
      compareDate(range.start, date) <= 0 &&
      compareDate(date, range.end) <= 0
    ) {
      return true;
    }
  }
  return false;
}

export function getUncoveredRanges(
  required: DateRange,
  coverage: DateCoverage,
): readonly DateRange[] {
  const gaps: DateRange[] = [];
  let cursor = required.start;
  let gapStart: LocalDate | null = null;
  let gapEnd: LocalDate | null = null;

  while (compareDate(cursor, required.end) <= 0) {
    if (!isDateCovered(cursor, coverage)) {
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

export function createCoverageDiagnostics(
  source: HolidaySource,
  required: DateRange,
  coverage: DateCoverage,
): readonly HolidayDiagnostic[] {
  const gaps = getUncoveredRanges(required, coverage);

  return gaps.map((gap) => ({
    level: "warning",
    code: "holiday-coverage-gap",
    message: `${source} holiday data does not cover ${toISODate(gap.start)} through ${toISODate(gap.end)}.`,
  }));
}
