import { compareDate, toISODate } from "../date/date";
import type {
  EffectiveHolidayRecord,
  HolidayBaseRecord,
  HolidayLibrarySnapshot,
  ManagementHolidayRecord,
} from "./types";

export function resolveEffectiveRecords(
  library: HolidayLibrarySnapshot,
  calendarId: string,
): ReadonlyMap<string, EffectiveHolidayRecord> {
  const result = new Map<string, EffectiveHolidayRecord>();

  for (const record of library.baseRecords) {
    if (record.calendarId !== calendarId) continue;
    result.set(toISODate(record.date), {
      calendarId,
      date: record.date,
      type: record.type,
      ...(record.name ? { name: record.name } : {}),
      provenance: "source",
    });
  }

  for (const override of library.overrides) {
    if (override.calendarId !== calendarId) continue;
    const key = toISODate(override.date);
    if (override.kind === "delete") {
      result.delete(key);
      continue;
    }
    result.set(key, {
      calendarId,
      date: override.date,
      type: override.type,
      ...(override.name ? { name: override.name } : {}),
      provenance: result.has(key) ? "manual-modified" : "manual-added",
    });
  }

  return result;
}

export function resolveManagementRecords(
  library: HolidayLibrarySnapshot,
  calendarId: string,
): readonly ManagementHolidayRecord[] {
  const map = new Map<string, ManagementHolidayRecord>();
  const baseMap = new Map<string, HolidayBaseRecord>();

  for (const record of library.baseRecords) {
    if (record.calendarId !== calendarId) continue;
    const key = toISODate(record.date);
    baseMap.set(key, record);
    map.set(key, {
      calendarId,
      date: record.date,
      type: record.type,
      ...(record.name ? { name: record.name } : {}),
      provenance: "source",
    });
  }

  for (const override of library.overrides) {
    if (override.calendarId !== calendarId) continue;
    const key = toISODate(override.date);
    if (override.kind === "delete") {
      const baseRec = baseMap.get(key);
      if (baseRec) {
        map.set(key, {
          calendarId,
          date: baseRec.date,
          type: baseRec.type,
          ...(baseRec.name ? { name: baseRec.name } : {}),
          provenance: "manual-deleted",
        });
      }
    } else {
      map.set(key, {
        calendarId,
        date: override.date,
        type: override.type,
        ...(override.name ? { name: override.name } : {}),
        provenance: baseMap.has(key) ? "manual-modified" : "manual-added",
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => compareDate(a.date, b.date));
}
