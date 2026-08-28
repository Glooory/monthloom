import {
  projectSnapshotV1Schema,
  type ProjectSnapshotV1,
} from "./projectSnapshot";
import {
  templateSnapshotV1Schema,
  type TemplateSnapshotV1,
} from "./templateSnapshot";
import {
  holidayCalendarSchema,
  holidayBaseRecordSchema,
  holidayOverrideSchema,
  holidayCoverageSchema,
  holidaySyncStateSchema,
  holidayLibrarySnapshotSchema,
  type HolidayLibrarySnapshotV1,
} from "./holidayLibrarySchema";
import type {
  HolidayCalendar,
  HolidayBaseRecord,
  HolidayOverride,
  HolidayCoverage,
  HolidaySyncState,
} from "../../domain/holiday/types";

export function validateProjectSnapshot(raw: unknown): ProjectSnapshotV1 {
  const parsed = projectSnapshotV1Schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid project snapshot: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateTemplateSnapshot(raw: unknown): TemplateSnapshotV1 {
  const parsed = templateSnapshotV1Schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid template snapshot: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateHolidayCalendar(raw: unknown): HolidayCalendar {
  const parsed = holidayCalendarSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid holiday calendar: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateHolidayBaseRecord(raw: unknown): HolidayBaseRecord {
  const parsed = holidayBaseRecordSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid holiday base record: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateHolidayOverride(raw: unknown): HolidayOverride {
  const parsed = holidayOverrideSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid holiday override: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateHolidayCoverage(raw: unknown): HolidayCoverage {
  const parsed = holidayCoverageSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid holiday coverage: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateHolidaySyncState(raw: unknown): HolidaySyncState {
  const parsed = holidaySyncStateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid holiday sync state: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateHolidayLibrarySnapshot(
  raw: unknown,
): HolidayLibrarySnapshotV1 {
  const parsed = holidayLibrarySnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid holiday library snapshot: ${parsed.error.message}`);
  }
  return parsed.data;
}
