import type {
  HolidayCalendar,
  HolidayBaseRecord,
  HolidayOverride,
  HolidayCoverage,
  HolidaySyncState,
  HolidayLibrarySnapshot,
} from "./types";

export type HolidayMergeSummary = Readonly<{
  addedCalendars: number;
  addedRecords: number;
  skippedOverrideConflicts: number;
}>;

export type LibraryMergeResult = Readonly<{
  merged: HolidayLibrarySnapshot;
  summary: HolidayMergeSummary;
  skippedOverrideConflicts: number;
}>;

export function mergeHolidayLibraries(
  local: HolidayLibrarySnapshot,
  incoming: HolidayLibrarySnapshot,
): LibraryMergeResult {
  // 1. Calendars: merge by ID, local takes precedence for metadata
  const calendarMap = new Map<string, HolidayCalendar>();
  for (const c of local.calendars) {
    calendarMap.set(c.id, c);
  }
  let addedCalendars = 0;
  for (const c of incoming.calendars) {
    if (!calendarMap.has(c.id)) {
      calendarMap.set(c.id, c);
      addedCalendars++;
    }
  }

  // 2. Base Records: merge by ID, incoming updates baseline
  const baseMap = new Map<string, HolidayBaseRecord>();
  for (const r of local.baseRecords) {
    baseMap.set(r.id, r);
  }
  let addedRecords = 0;
  for (const r of incoming.baseRecords) {
    if (!baseMap.has(r.id)) {
      addedRecords++;
    }
    baseMap.set(r.id, r);
  }

  // 3. Overrides: local manual overrides take precedence!
  const overrideMap = new Map<string, HolidayOverride>();
  for (const o of local.overrides) {
    overrideMap.set(o.id, o);
  }

  let skippedOverrideConflicts = 0;
  for (const o of incoming.overrides) {
    if (overrideMap.has(o.id)) {
      skippedOverrideConflicts++;
    } else {
      overrideMap.set(o.id, o);
      addedRecords++;
    }
  }

  // 4. Coverage: merge by ID
  const coverageMap = new Map<string, HolidayCoverage>();
  for (const c of local.coverage) {
    coverageMap.set(c.id, c);
  }
  for (const c of incoming.coverage) {
    if (!coverageMap.has(c.id)) {
      coverageMap.set(c.id, c);
    }
  }

  // 5. SyncStates: merge by calendarId
  const syncMap = new Map<string, HolidaySyncState>();
  for (const s of local.syncStates) {
    syncMap.set(s.calendarId, s);
  }
  for (const s of incoming.syncStates) {
    if (!syncMap.has(s.calendarId)) {
      syncMap.set(s.calendarId, s);
    }
  }

  const summary: HolidayMergeSummary = {
    addedCalendars,
    addedRecords,
    skippedOverrideConflicts,
  };

  return {
    merged: {
      calendars: Array.from(calendarMap.values()),
      baseRecords: Array.from(baseMap.values()),
      overrides: Array.from(overrideMap.values()),
      coverage: Array.from(coverageMap.values()),
      syncStates: Array.from(syncMap.values()),
    },
    summary,
    skippedOverrideConflicts,
  };
}

