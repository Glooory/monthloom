import { addDays, dayOfWeek, daysInMonth, toISODate } from "../date/date";
import type { HolidayIndex } from "../holiday/types";
import type { CalendarCell, CalendarMonth, CalendarWeek } from "./types";

export function generateCalendarMonth(
  year: number,
  month: number,
  holidayIndex?: HolidayIndex,
  startOfWeek: 0 | 1 = 0,
): CalendarMonth {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}`);
  }

  const firstDate = { year, month, day: 1 };
  const firstDow = dayOfWeek(firstDate);
  const currentMonthDays = daysInMonth(year, month);

  const offset = (firstDow - startOfWeek + 7) % 7;
  const rawWeekCount = Math.ceil((offset + currentMonthDays) / 7);
  if (rawWeekCount !== 4 && rawWeekCount !== 5 && rawWeekCount !== 6) {
    throw new Error(`Unexpected week count: ${rawWeekCount}`);
  }
  const weekCount = rawWeekCount as 4 | 5 | 6;

  const firstVisibleDate = addDays(firstDate, -offset);
  const totalCells = weekCount * 7;

  const weeks: CalendarWeek[] = [];
  let currentWeek: CalendarCell[] = [];

  for (let index = 0; index < totalCells; index++) {
    const cellDate = addDays(firstVisibleDate, index);
    const cellDayOfWeek = dayOfWeek(cellDate);
    const inCurrentMonth = cellDate.year === year && cellDate.month === month;
    const holiday = holidayIndex?.get(toISODate(cellDate));

    const cell: CalendarCell = {
      date: cellDate,
      dayOfWeek: cellDayOfWeek,
      inCurrentMonth,
      ...(holiday ? { holiday } : {}),
    };

    currentWeek.push(cell);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return {
    year,
    month,
    weekCount,
    weeks,
    startOfWeek,
  };
}
