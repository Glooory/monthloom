import type { DayOfWeek, LocalDate } from "../date/types";
import type { HolidayInfo } from "../holiday/types";

export type YearMonth = Readonly<{
  year: number;
  month: number;
}>;

export type CalendarCell = Readonly<{
  date: LocalDate;
  dayOfWeek: DayOfWeek;
  inCurrentMonth: boolean;
  holiday?: HolidayInfo;
}>;

export type CalendarWeek = readonly CalendarCell[];

export type CalendarMonth = Readonly<{
  year: number;
  month: number;
  weekCount: 4 | 5 | 6;
  weeks: readonly CalendarWeek[];
}>;
