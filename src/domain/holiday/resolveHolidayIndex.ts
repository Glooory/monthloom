import type { HolidayLayer } from "../template/holidayLayer";
import { resolveEffectiveRecords } from "./effectiveRecords";
import type {
  HolidayLibrarySnapshot,
  HolidayRecordType,
} from "./types";

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

export function resolveHolidayIndex(args: {
  library: HolidayLibrarySnapshot;
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

    for (const [isoDate, record] of effectiveRecords) {
      let entry = resultMap.get(isoDate);
      if (!entry) {
        entry = { occurrences: [] };
        resultMap.set(isoDate, entry);
      }

      entry.occurrences.push({
        layerId: layer.id,
        calendarId: layer.calendarId,
        type: record.type,
        ...(record.name ? { name: record.name } : {}),
      });

      if (layer.main.dateColors.enabled) {
        entry.mainDateColor =
          record.type === "holiday"
            ? layer.main.dateColors.holiday
            : layer.main.dateColors.workday;
      }

      if (layer.mini.dateColors.enabled) {
        entry.miniDateColor =
          record.type === "holiday"
            ? layer.mini.dateColors.holiday
            : layer.mini.dateColors.workday;
      }
    }
  }

  return resultMap;
}
