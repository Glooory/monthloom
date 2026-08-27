import type { CalendarCell } from "../../domain/calendar/types";

export type CalendarColors = Readonly<{
  default: string;
  sunday: string;
  saturday: string;
  japanHoliday: string;
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
