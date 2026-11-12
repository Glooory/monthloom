import { toISODate } from "../date/date";
import { getChineseFestivals } from "./chineseFestivals";
import { BUILTIN_CHINA_CALENDAR_ID } from "./types";
import type { HolidayLayer } from "../template/holidayLayer";
import { resolveEffectiveRecords } from "./effectiveRecords";
import type { HolidayLibrarySnapshot, HolidayRecordType } from "./types";

export type HolidayOccurrence = Readonly<{
  layerId: string;
  calendarId: string;
  /** Absent for a calculated festival without a known leave/workday status. */
  type?: HolidayRecordType;
  name?: string;
}>;

export type ResolvedHolidayDate = Readonly<{
  occurrences: readonly HolidayOccurrence[];
  mainDateColor?: string;
  miniDateColor?: string;
}>;

export type HolidayIndex = ReadonlyMap<string, ResolvedHolidayDate>;

export function resolveHolidayIndex(args: {
  library: HolidayLibrarySnapshot;
  targetYear?: number;
  layers: readonly HolidayLayer[];
}): HolidayIndex {
  const { library, layers } = args;
  const resultMap = new Map<
    string,
    {
      occurrences: HolidayOccurrence[];
      mainDateColor?: string;
      miniDateColor?: string;
    }
  >();

  for (const layer of layers) {
    if (!layer.enabled) continue;
    const effectiveRecords = resolveEffectiveRecords(library, layer.calendarId);

    const isChinese = layer.calendarId === BUILTIN_CHINA_CALENDAR_ID;
    const festivals = new Map<string, string>();
    if (isChinese) {
      // Runtime callers supply the target year so labels also exist before sync.
      const years =
        args.targetYear === undefined
          ? new Set([
              ...Array.from(effectiveRecords.values(), (r) => r.date.year),
              ...library.coverage
                .filter((c) => c.calendarId === layer.calendarId)
                .flatMap((c) => [c.start.year, c.end.year]),
            ])
          : new Set([
              args.targetYear - 1,
              args.targetYear,
              args.targetYear + 1,
            ]);
      for (const year of years) {
        for (const [date, name] of getChineseFestivals(year))
          festivals.set(date, name);
      }
    }
    const deletedDates = new Set(
      library.overrides
        .filter((o) => o.calendarId === layer.calendarId && o.kind === "delete")
        .map((o) => toISODate(o.date)),
    );
    const dates = new Set([...effectiveRecords.keys(), ...festivals.keys()]);
    for (const isoDate of dates) {
      if (deletedDates.has(isoDate)) continue;
      const record = effectiveRecords.get(isoDate);
      const name =
        record && (!isChinese || record.provenance !== "source")
          ? record.type === "holiday"
            ? record.name
            : undefined
          : festivals.get(isoDate);
      let entry = resultMap.get(isoDate);
      if (!entry) {
        entry = { occurrences: [] };
        resultMap.set(isoDate, entry);
      }

      entry.occurrences.push({
        layerId: layer.id,
        calendarId: layer.calendarId,
        ...(record ? { type: record.type } : {}),
        ...(name ? { name } : {}),
      });

      if (record && layer.main.dateColors.enabled) {
        entry.mainDateColor =
          record.type === "holiday"
            ? layer.main.dateColors.holiday
            : layer.main.dateColors.workday;
      }

      if (record && layer.mini.dateColors.enabled) {
        entry.miniDateColor =
          record.type === "holiday"
            ? layer.mini.dateColors.holiday
            : layer.mini.dateColors.workday;
      }
    }
  }

  return resultMap;
}
