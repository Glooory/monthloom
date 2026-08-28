import type { CalendarCell } from "../../domain/calendar/types";
import type { DayOfWeek } from "../../domain/date/types";

export type CalendarColors = Readonly<{
  default: string;
  sunday: string;
  saturday: string;
  japanHoliday: string;
}>;

export type WeekdayColorConfig = Readonly<{
  default: string;
  sunday?: string;
  saturday?: string;
}>;

export function resolveDateColor(
  cell: CalendarCell,
  colors: CalendarColors,
): string {
  if (cell.holiday?.japan) {
    return colors.japanHoliday;
  }
  if (cell.dayOfWeek === 0) {
    return colors.sunday;
  }
  if (cell.dayOfWeek === 6) {
    return colors.saturday;
  }
  return colors.default;
}

export function resolveWeekdayColor(
  dayOfWeek: DayOfWeek,
  colors: WeekdayColorConfig,
): string {
  if (dayOfWeek === 0 && colors.sunday) {
    return colors.sunday;
  }
  if (dayOfWeek === 6 && colors.saturday) {
    return colors.saturday;
  }
  return colors.default;
}

