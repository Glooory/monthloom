import { z } from "zod";
import { compareDate, parseISODate } from "../../date/date";
import type { DateRange } from "../../date/types";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  holidayRecordId,
  type HolidayBaseRecord,
  type HolidayBaseUpdate,
  type HolidayCoverage,
} from "../types";

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

export function normalizeChinaTimorHolidayYear(
  raw: unknown,
  calendarId: string = BUILTIN_CHINA_CALENDAR_ID,
  source: "sync" | "provider-import" = "sync",
): HolidayBaseUpdate {
  const parseResult = timorYearSchema.safeParse(raw);
  if (!parseResult.success) {
    throw new Error(
      `Malformed China Timor dataset: ${parseResult.error.message}`,
    );
  }

  const data = parseResult.data;
  if (data.code !== 0) {
    throw new Error(`China Timor response returned error code: ${data.code}`);
  }

  const now = new Date().toISOString();
  const holidayEntries = Object.values(data.holiday);
  const records: HolidayBaseRecord[] = [];
  const years = new Set<number>();

  for (const item of holidayEntries) {
    const parsedDate = parseISODate(item.date);
    if (!parsedDate) {
      throw new Error(`Invalid date field in China Timor item: ${item.date}`);
    }

    years.add(parsedDate.year);
    records.push({
      id: holidayRecordId(calendarId, parsedDate),
      calendarId,
      date: parsedDate,
      type: item.holiday ? "holiday" : "workday",
      ...(item.name ? { name: item.name } : {}),
      source,
      updatedAt: now,
    });
  }

  records.sort((a, b) => compareDate(a.date, b.date));

  const sortedYears = Array.from(years).sort((a, b) => a - b);
  const replacementRanges: DateRange[] = sortedYears.map((year) => ({
    start: { year, month: 1, day: 1 },
    end: { year, month: 12, day: 31 },
  }));

  const coverage: HolidayCoverage[] = sortedYears.map((year) => ({
    id: `${calendarId}:${year}`,
    calendarId,
    start: { year, month: 1, day: 1 },
    end: { year, month: 12, day: 31 },
    status: "confirmed",
    source,
    updatedAt: now,
  }));

  return {
    calendarId,
    records,
    coverage,
    replacementRanges,
  };
}

export async function fetchChinaHolidayYear(
  year: number,
  fetchImpl: typeof fetch = fetch,
  calendarId: string = BUILTIN_CHINA_CALENDAR_ID,
): Promise<HolidayBaseUpdate> {
  const res = await fetchImpl(`https://timor.tech/api/holiday/year/${year}/`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch China holidays for year ${year}: HTTP ${res.status}`,
    );
  }
  const json = await res.json();
  return normalizeChinaTimorHolidayYear(json, calendarId, "sync");
}
