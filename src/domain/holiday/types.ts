import type { DateRange, LocalDate } from "../date/types";

export type HolidayInfo = Readonly<{
  china?: Readonly<{
    type: "holiday" | "workday";
    name?: string;
  }>;
  japan?: Readonly<{
    name: string;
  }>;
}>;

export type HolidayEntry = Readonly<{
  date: LocalDate;
  info: HolidayInfo;
}>;

export type HolidaySource = "china-timor" | "japan-holidays-jp";

export type HolidayDiagnostic = Readonly<{
  level: "warning" | "error";
  code: string;
  message: string;
}>;

export type DateCoverage = Readonly<{
  ranges: readonly DateRange[];
}>;

export type HolidayDataset = Readonly<{
  source: HolidaySource;
  entries: readonly HolidayEntry[];
  coverage: DateCoverage;
  diagnostics: readonly HolidayDiagnostic[];
}>;

export type HolidayIndex = ReadonlyMap<string, HolidayInfo>;
