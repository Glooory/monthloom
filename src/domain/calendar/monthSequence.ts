import { compareDate, daysInMonth } from "../date/date";
import type { DateRange, LocalDate } from "../date/types";
import { generateCalendarMonth } from "./generateCalendarMonth";
import type { YearMonth } from "./types";

export function getMainMonths(targetYear: number): readonly YearMonth[] {
  const months: YearMonth[] = [];

  for (let m = 1; m <= 12; m++) {
    months.push({ year: targetYear, month: m });
  }
  months.push({ year: targetYear + 1, month: 1 });

  return months;
}

export function getMiniMonths(targetYear: number): readonly YearMonth[] {
  const months: YearMonth[] = [{ year: targetYear - 1, month: 12 }];

  for (let m = 1; m <= 12; m++) {
    months.push({ year: targetYear, month: m });
  }
  months.push({ year: targetYear + 1, month: 1 });

  return months;
}

export function getPreviewExtraMiniMonths(
  targetYear: number,
): readonly YearMonth[] {
  return [{ year: targetYear + 1, month: 2 }];
}

export function calculateRequiredHolidayRange(targetYear: number): DateRange {
  const dates: LocalDate[] = [];

  // 1. Formal Main months (including visible adjacent cells)
  for (const month of getMainMonths(targetYear)) {
    const calendarMonth = generateCalendarMonth(month.year, month.month);
    for (const week of calendarMonth.weeks) {
      for (const cell of week) {
        dates.push(cell.date);
      }
    }
  }

  // 2. Formal Mini months (first and last days)
  for (const month of getMiniMonths(targetYear)) {
    dates.push({ year: month.year, month: month.month, day: 1 });
    dates.push({
      year: month.year,
      month: month.month,
      day: daysInMonth(month.year, month.month),
    });
  }

  // 3. Preview-only Mini months (first and last days)
  for (const month of getPreviewExtraMiniMonths(targetYear)) {
    dates.push({ year: month.year, month: month.month, day: 1 });
    dates.push({
      year: month.year,
      month: month.month,
      day: daysInMonth(month.year, month.month),
    });
  }

  if (dates.length === 0) {
    throw new Error("No dates collected for required holiday range");
  }

  let minDate = dates[0];
  let maxDate = dates[0];

  for (let i = 1; i < dates.length; i++) {
    const d = dates[i];
    if (compareDate(d, minDate) < 0) {
      minDate = d;
    }
    if (compareDate(d, maxDate) > 0) {
      maxDate = d;
    }
  }

  return {
    start: minDate,
    end: maxDate,
  };
}
