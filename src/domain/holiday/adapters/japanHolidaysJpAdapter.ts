import { z } from "zod";
import { parseISODate } from "../../date/date";
import type { DateRange } from "../../date/types";
import {
  BUILTIN_JAPAN_CALENDAR_ID,
  holidayRecordId,
  type HolidayBaseRecord,
  type HolidayBaseUpdate,
  type HolidayCoverage,
} from "../types";

const japanHolidaysJpSchema = z.record(z.string(), z.string());

export function normalizeJapanHolidaysJp(
  raw: unknown,
  calendarId: string = BUILTIN_JAPAN_CALENDAR_ID,
  source: "sync" | "provider-import" = "sync",
): HolidayBaseUpdate {
  const parseResult = japanHolidaysJpSchema.safeParse(raw);
  if (!parseResult.success) {
    throw new Error(
      `Malformed Japan holidays dataset: ${parseResult.error.message}`,
    );
  }

  const data = parseResult.data;
  const sortedKeys = Object.keys(data).sort();
  const records: HolidayBaseRecord[] = [];
  const years = new Set<number>();
  const now = new Date().toISOString();

  for (const key of sortedKeys) {
    const parsedDate = parseISODate(key);
    if (!parsedDate) {
      throw new Error(`Invalid date key in Japan holidays data: ${key}`);
    }

    years.add(parsedDate.year);
    records.push({
      id: holidayRecordId(calendarId, parsedDate),
      calendarId,
      date: parsedDate,
      type: "holiday",
      name: data[key],
      source,
      updatedAt: now,
    });
  }

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

export async function fetchJapanHolidayYear(
  year: number,
  fetchImpl: typeof fetch = fetch,
  calendarId: string = BUILTIN_JAPAN_CALENDAR_ID,
): Promise<HolidayBaseUpdate> {
  const res = await fetchImpl(
    `https://holidays-jp.github.io/api/v1/${year}/date.json`,
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch Japan holidays for year ${year}: HTTP ${res.status}`,
    );
  }
  const json = await res.json();
  return normalizeJapanHolidaysJp(json, calendarId, "sync");
}
