import { z } from "zod";
import { compareDate, parseISODate } from "../../date/date";
import type { DateRange } from "../../date/types";
import type { HolidayDataset, HolidayEntry } from "../types";

const holidayItemSchema = z
  .object({
    holiday: z.boolean(),
    name: z.string().optional(),
    date: z.string(),
  })
  .passthrough();

const timorYearSchema = z
  .object({
    code: z.number(),
    holiday: z.record(z.string(), holidayItemSchema),
  })
  .passthrough();

export function parseChinaTimorHolidayYear(raw: unknown): HolidayDataset {
  const parseResult = timorYearSchema.safeParse(raw);
  if (!parseResult.success) {
    return {
      source: "china-timor",
      entries: [],
      coverage: { ranges: [] },
      diagnostics: [
        {
          level: "error",
          code: "invalid-china-timor",
          message: `Malformed China Timor dataset: ${parseResult.error.message}`,
        },
      ],
    };
  }

  const data = parseResult.data;

  if (data.code !== 0) {
    return {
      source: "china-timor",
      entries: [],
      coverage: { ranges: [] },
      diagnostics: [
        {
          level: "error",
          code: "china-timor-error",
          message: `China Timor response returned error code: ${data.code}`,
        },
      ],
    };
  }

  const holidayEntries = Object.values(data.holiday);
  if (holidayEntries.length === 0) {
    return {
      source: "china-timor",
      entries: [],
      coverage: { ranges: [] },
      diagnostics: [
        {
          level: "warning",
          code: "china-timor-coverage-unresolved",
          message: "Empty holiday dataset cannot resolve coverage range.",
        },
      ],
    };
  }

  const entries: HolidayEntry[] = [];
  const years = new Set<number>();

  for (const item of holidayEntries) {
    const parsedDate = parseISODate(item.date);
    if (!parsedDate) {
      return {
        source: "china-timor",
        entries: [],
        coverage: { ranges: [] },
        diagnostics: [
          {
            level: "error",
            code: "invalid-china-timor-date",
            message: `Invalid date field in China Timor item: ${item.date}`,
          },
        ],
      };
    }

    years.add(parsedDate.year);
    entries.push({
      date: parsedDate,
      info: {
        china: {
          type: item.holiday ? "holiday" : "workday",
          ...(item.name !== undefined ? { name: item.name } : {}),
        },
      },
    });
  }

  entries.sort((a, b) => compareDate(a.date, b.date));

  const coverageRanges: DateRange[] = Array.from(years)
    .sort((a, b) => a - b)
    .map((year) => ({
      start: { year, month: 1, day: 1 },
      end: { year, month: 12, day: 31 },
    }));

  return {
    source: "china-timor",
    entries,
    coverage: { ranges: coverageRanges },
    diagnostics: [],
  };
}
