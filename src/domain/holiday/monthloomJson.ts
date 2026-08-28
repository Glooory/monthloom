import { z } from "zod";
import { compareDate, parseISODate, toISODate } from "../date/date";
import {
  holidayRecordId,
  type EffectiveHolidayRecord,
  type HolidayBaseRecord,
  type HolidayCalendar,
  type HolidayCoverage,
  type HolidayCoverageStatus,
  type HolidayRecordType,
} from "./types";

const isoDateStringSchema = z.string().refine((val) => parseISODate(val) !== null, {
  message: "Invalid ISO date (YYYY-MM-DD)",
});

const monthloomRecordSchema = z.object({
  date: isoDateStringSchema,
  type: z.enum(["holiday", "workday"]),
  name: z.string().optional(),
});

const monthloomCoverageSchema = z
  .object({
    start: isoDateStringSchema,
    end: isoDateStringSchema,
    status: z.enum(["confirmed", "unconfirmed"]),
  })
  .refine(
    (data) => {
      const s = parseISODate(data.start);
      const e = parseISODate(data.end);
      return s && e && compareDate(s, e) <= 0;
    },
    { message: "Coverage start date must be before or equal to end date" },
  );


const monthloomExchangeSchema = z.object({
  format: z.literal("monthloom-holidays"),
  version: z.literal(1),
  calendar: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  coverage: z.array(monthloomCoverageSchema).optional(),
  records: z.array(monthloomRecordSchema),
});

export type MonthloomHolidayExchange = Readonly<{
  calendar: {
    id: string;
    name: string;
  };
  records: readonly HolidayBaseRecord[];
  coverage: readonly HolidayCoverage[];
}>;

export function parseMonthloomHolidayJson(
  raw: unknown,
): MonthloomHolidayExchange {
  const parseResult = monthloomExchangeSchema.safeParse(raw);
  if (!parseResult.success) {
    throw new Error(
      `Invalid Monthloom Holiday JSON: ${parseResult.error.message}`,
    );
  }

  const data = parseResult.data;
  const calendarId = data.calendar.id;
  const now = new Date().toISOString();

  // Validate no duplicate dates
  const seenDates = new Set<string>();
  const records: HolidayBaseRecord[] = [];

  for (const item of data.records) {
    if (seenDates.has(item.date)) {
      throw new Error(
        `Invalid Monthloom Holiday JSON: Duplicate date found: ${item.date}`,
      );
    }
    seenDates.add(item.date);
    const date = parseISODate(item.date)!;

    records.push({
      id: holidayRecordId(calendarId, date),
      calendarId,
      date,
      type: item.type as HolidayRecordType,
      ...(item.name ? { name: item.name } : {}),
      source: "monthloom-import",
      updatedAt: now,
    });
  }

  const coverage: HolidayCoverage[] = (data.coverage ?? []).map(
    (cov, index) => ({
      id: `${calendarId}:import-cov-${index}`,
      calendarId,
      start: parseISODate(cov.start)!,
      end: parseISODate(cov.end)!,
      status: cov.status as HolidayCoverageStatus,
      source: "monthloom-import",
      updatedAt: now,
    }),
  );

  return {
    calendar: data.calendar,
    records,
    coverage,
  };
}

export function serializeMonthloomHolidayJson(args: {
  calendar: HolidayCalendar;
  records: readonly EffectiveHolidayRecord[];
  coverage?: readonly HolidayCoverage[];
}): string {
  const { calendar, records, coverage } = args;

  const sortedRecords = [...records].sort((a, b) =>
    toISODate(a.date).localeCompare(toISODate(b.date)),
  );

  const payload = {
    format: "monthloom-holidays",
    version: 1,
    calendar: {
      id: calendar.id,
      name: calendar.name,
    },
    ...(coverage && coverage.length > 0
      ? {
          coverage: coverage.map((c) => ({
            start: toISODate(c.start),
            end: toISODate(c.end),
            status: c.status,
          })),
        }
      : {}),
    records: sortedRecords.map((r) => ({
      date: toISODate(r.date),
      type: r.type,
      ...(r.name ? { name: r.name } : {}),
    })),
  };

  return JSON.stringify(payload, null, 2);
}
