import { toISODate } from "../date/date";
import type { HolidayDataset, HolidayIndex, HolidayInfo } from "./types";

export function buildHolidayIndex(
  datasets: readonly HolidayDataset[],
): HolidayIndex {
  const index = new Map<string, HolidayInfo>();

  for (const dataset of datasets) {
    for (const entry of dataset.entries) {
      const key = toISODate(entry.date);
      const current = index.get(key) ?? {};
      index.set(key, {
        ...current,
        ...entry.info,
      });
    }
  }

  return index;
}
