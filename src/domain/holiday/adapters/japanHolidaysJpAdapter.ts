import { z } from "zod";
import { parseISODate } from "../../date/date";
import type { DateRange } from "../../date/types";
import type { HolidayDataset, HolidayEntry } from "../types";

const japanHolidaysJpSchema = z.record(z.string(), z.string());

export function parseJapanHolidaysJp(raw: unknown): HolidayDataset {
  const parseResult = japanHolidaysJpSchema.safeParse(raw);
  if (!parseResult.success) {
    return {
      source: "japan-holidays-jp",
      entries: [],
      coverage: { ranges: [] },
      diagnostics: [
        {
          level: "error",
          code: "invalid-japan-holidays-jp",
          message: `Malformed Japan holidays dataset: ${parseResult.error.message}`,
        },
      ],
    };
  }

  const data = parseResult.data;
  const sortedKeys = Object.keys(data).sort();
  const entries: HolidayEntry[] = [];
  const years = new Set<number>();

  for (const key of sortedKeys) {
    const parsedDate = parseISODate(key);
    if (!parsedDate) {
      return {
        source: "japan-holidays-jp",
        entries: [],
        coverage: { ranges: [] },
        diagnostics: [
          {
            level: "error",
            code: "invalid-japan-holiday-date",
            message: `Invalid date key in Japan holidays data: ${key}`,
          },
        ],
      };
    }

    years.add(parsedDate.year);
    entries.push({
      date: parsedDate,
      info: {
        japan: {
          name: data[key],
        },
      },
    });
  }

  const coverageRanges: DateRange[] = Array.from(years)
    .sort((a, b) => a - b)
    .map((year) => ({
      start: { year, month: 1, day: 1 },
      end: { year, month: 12, day: 31 },
    }));

  return {
    source: "japan-holidays-jp",
    entries,
    coverage: { ranges: coverageRanges },
    diagnostics: [],
  };
}
