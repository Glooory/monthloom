import type { DateRange, LocalDate } from "../date/types";

export type HolidayProviderId = "china-timor" | "japan-holidays-jp";
export type HolidayRecordType = "holiday" | "workday";
export type HolidayCoverageStatus = "confirmed" | "unconfirmed";

export const BUILTIN_CHINA_CALENDAR_ID = "builtin-cn-public-holidays";
export const BUILTIN_JAPAN_CALENDAR_ID = "builtin-jp-public-holidays";

export type NormalizedHolidayRecord = Readonly<{
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
}>;

export type HolidayCalendar = Readonly<{
  id: string;
  name: string;
  builtin: boolean;
  provider?: HolidayProviderId;
  createdAt: string;
  updatedAt: string;
}>;

export type HolidayBaseRecord = Readonly<{
  id: string;
  calendarId: string;
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
  source: "sync" | "provider-import" | "monthloom-import";
  updatedAt: string;
}>;

export type HolidayOverride =
  | Readonly<{
      id: string;
      calendarId: string;
      date: LocalDate;
      kind: "upsert";
      type: HolidayRecordType;
      name?: string;
      updatedAt: string;
    }>
  | Readonly<{
      id: string;
      calendarId: string;
      date: LocalDate;
      kind: "delete";
      updatedAt: string;
    }>;

export type HolidayCoverage = Readonly<{
  id: string;
  calendarId: string;
  start: LocalDate;
  end: LocalDate;
  status: HolidayCoverageStatus;
  source: "sync" | "provider-import" | "monthloom-import" | "manual";
  updatedAt: string;
}>;

export type HolidaySyncState = Readonly<{
  calendarId: string;
  status: "never" | "success" | "error";
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  errorMessage?: string;
}>;

export type HolidayLibrarySnapshot = Readonly<{
  calendars: readonly HolidayCalendar[];
  baseRecords: readonly HolidayBaseRecord[];
  overrides: readonly HolidayOverride[];
  coverage: readonly HolidayCoverage[];
  syncStates: readonly HolidaySyncState[];
}>;

export type EffectiveHolidayRecord = Readonly<{
  calendarId: string;
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
  provenance: "source" | "manual-modified" | "manual-added";
}>;

export type ManagementHolidayRecord = Readonly<{
  calendarId: string;
  date: LocalDate;
  type: HolidayRecordType;
  name?: string;
  provenance: "source" | "manual-modified" | "manual-added" | "manual-deleted";
}>;

export type HolidayBaseUpdate = Readonly<{
  calendarId: string;
  records: readonly HolidayBaseRecord[];
  coverage: readonly HolidayCoverage[];
  replacementRanges: readonly DateRange[];
}>;

export type HolidayDiagnostic = Readonly<{
  level: "warning" | "error";
  code: string;
  message: string;
}>;

export function holidayRecordId(calendarId: string, date: LocalDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${calendarId}:${date.year}-${month}-${day}`;
}

export type HolidayOccurrence = Readonly<{
  layerId: string;
  calendarId: string;
  type: HolidayRecordType;
  name?: string;
}>;

export type ResolvedHolidayDate = Readonly<{
  occurrences: readonly HolidayOccurrence[];
  mainDateColor?: string;
  miniDateColor?: string;
}>;

export type HolidayIndex = ReadonlyMap<string, ResolvedHolidayDate>;
