export type LocalDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DateRange = Readonly<{
  start: LocalDate;
  end: LocalDate;
}>;
