import { parseISODate } from "../date/date";
import type { LocalDate } from "../date/types";
import {
  holidayRecordId,
  type HolidayBaseRecord,
  type HolidayLibrarySnapshot,
  type HolidayOverride,
  type HolidayRecordType,
} from "./types";

export function mustDate(value: string): LocalDate {
  const parsed = parseISODate(value);
  if (!parsed) throw new Error(`Invalid test date: ${value}`);
  return parsed;
}

export function fixtureLibrary(
  input: Partial<HolidayLibrarySnapshot> = {},
): HolidayLibrarySnapshot {
  return {
    calendars: input.calendars ?? [],
    baseRecords: input.baseRecords ?? [],
    overrides: input.overrides ?? [],
    coverage: input.coverage ?? [],
    syncStates: input.syncStates ?? [],
  };
}

export function base(
  calendarId: string,
  isoDate: string,
  type: HolidayRecordType,
  name?: string,
): HolidayBaseRecord {
  const date = mustDate(isoDate);
  return {
    id: holidayRecordId(calendarId, date),
    calendarId,
    date,
    type,
    ...(name ? { name } : {}),
    source: "sync",
    updatedAt: "2026-08-28T00:00:00.000Z",
  };
}

export function overrideUpsert(
  calendarId: string,
  isoDate: string,
  type: HolidayRecordType,
  name?: string,
): HolidayOverride {
  const date = mustDate(isoDate);
  return {
    id: holidayRecordId(calendarId, date),
    calendarId,
    date,
    kind: "upsert",
    type,
    ...(name ? { name } : {}),
    updatedAt: "2026-08-28T00:00:00.000Z",
  };
}

export function overrideDelete(
  calendarId: string,
  isoDate: string,
): HolidayOverride {
  const date = mustDate(isoDate);
  return {
    id: holidayRecordId(calendarId, date),
    calendarId,
    date,
    kind: "delete",
    updatedAt: "2026-08-28T00:00:00.000Z",
  };
}
