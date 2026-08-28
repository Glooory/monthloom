import { z } from "zod";
import { compareDate, isValidLocalDate } from "../../domain/date/date";
import { holidayRecordId } from "../../domain/holiday/types";

export const localDateSchema = z
  .object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  })
  .refine(isValidLocalDate, {
    message: "Invalid calendar date (day exceeds month length or leap year rules)",
  });

export const holidayRecordTypeSchema = z.enum(["holiday", "workday"]);
export const holidayProviderIdSchema = z.enum([
  "china-timor",
  "japan-holidays-jp",
]);
export const holidayCoverageStatusSchema = z.enum([
  "confirmed",
  "unconfirmed",
]);

export const holidayCalendarSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  builtin: z.boolean(),
  provider: holidayProviderIdSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const holidayBaseRecordSchema = z.object({
  id: z.string().min(1),
  calendarId: z.string().min(1),
  date: localDateSchema,
  type: holidayRecordTypeSchema,
  name: z.string().optional(),
  source: z.enum(["sync", "provider-import", "monthloom-import"]),
  updatedAt: z.string().datetime(),
});

export const holidayOverrideSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string().min(1),
    calendarId: z.string().min(1),
    date: localDateSchema,
    kind: z.literal("upsert"),
    type: holidayRecordTypeSchema,
    name: z.string().optional(),
    updatedAt: z.string().datetime(),
  }),
  z.object({
    id: z.string().min(1),
    calendarId: z.string().min(1),
    date: localDateSchema,
    kind: z.literal("delete"),
    updatedAt: z.string().datetime(),
  }),
]);

export const holidayCoverageSchema = z
  .object({
    id: z.string().min(1),
    calendarId: z.string().min(1),
    start: localDateSchema,
    end: localDateSchema,
    status: holidayCoverageStatusSchema,
    source: z.enum(["sync", "provider-import", "monthloom-import", "manual"]),
    updatedAt: z.string().datetime(),
  })
  .refine((data) => compareDate(data.start, data.end) <= 0, {
    message: "Coverage start date must be before or equal to end date",
  });

export const holidaySyncStateSchema = z.object({
  calendarId: z.string().min(1),
  status: z.enum(["never", "success", "error"]),
  lastAttemptAt: z.string().datetime().optional(),
  lastSuccessAt: z.string().datetime().optional(),
  errorMessage: z.string().optional(),
});

export const holidayLibrarySnapshotSchema = z
  .object({
    calendars: z.array(holidayCalendarSchema),
    baseRecords: z.array(holidayBaseRecordSchema),
    overrides: z.array(holidayOverrideSchema),
    coverage: z.array(holidayCoverageSchema),
    syncStates: z.array(holidaySyncStateSchema),
  })
  .superRefine((snapshot, ctx) => {
    const calendarIds = new Set<string>();
    for (let i = 0; i < snapshot.calendars.length; i++) {
      const cal = snapshot.calendars[i];
      if (calendarIds.has(cal.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate calendar ID "${cal.id}" in snapshot`,
          path: ["calendars", i, "id"],
        });
      }
      calendarIds.add(cal.id);
    }

    // 1. Base records: canonical ID, unique (calendarId, date), calendar reference
    const seenBaseDateKeys = new Set<string>();
    for (let i = 0; i < snapshot.baseRecords.length; i++) {
      const rec = snapshot.baseRecords[i];
      if (!calendarIds.has(rec.calendarId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown calendarId "${rec.calendarId}" in baseRecords`,
          path: ["baseRecords", i, "calendarId"],
        });
      }
      const canonicalId = holidayRecordId(rec.calendarId, rec.date);
      if (rec.id !== canonicalId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Non-canonical record ID "${rec.id}", expected canonical ID "${canonicalId}"`,
          path: ["baseRecords", i, "id"],
        });
      }
      const dateKey = `${rec.calendarId}:${rec.date.year}-${rec.date.month}-${rec.date.day}`;
      if (seenBaseDateKeys.has(dateKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate date "${dateKey}" in baseRecords`,
          path: ["baseRecords", i, "date"],
        });
      }
      seenBaseDateKeys.add(dateKey);
    }

    // 2. Overrides: canonical ID, unique (calendarId, date), calendar reference
    const seenOverrideDateKeys = new Set<string>();
    for (let i = 0; i < snapshot.overrides.length; i++) {
      const over = snapshot.overrides[i];
      if (!calendarIds.has(over.calendarId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown calendarId "${over.calendarId}" in overrides`,
          path: ["overrides", i, "calendarId"],
        });
      }
      const canonicalId = holidayRecordId(over.calendarId, over.date);
      if (over.id !== canonicalId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Non-canonical record ID "${over.id}", expected canonical ID "${canonicalId}"`,
          path: ["overrides", i, "id"],
        });
      }
      const dateKey = `${over.calendarId}:${over.date.year}-${over.date.month}-${over.date.day}`;
      if (seenOverrideDateKeys.has(dateKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate date "${dateKey}" in overrides`,
          path: ["overrides", i, "date"],
        });
      }
      seenOverrideDateKeys.add(dateKey);
    }

    // 3. Coverage: calendar reference
    for (let i = 0; i < snapshot.coverage.length; i++) {
      const cov = snapshot.coverage[i];
      if (!calendarIds.has(cov.calendarId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown calendarId "${cov.calendarId}" in coverage`,
          path: ["coverage", i, "calendarId"],
        });
      }
    }

    // 4. SyncStates: calendar reference and unique per calendar
    const seenSyncCalendars = new Set<string>();
    for (let i = 0; i < snapshot.syncStates.length; i++) {
      const sync = snapshot.syncStates[i];
      if (!calendarIds.has(sync.calendarId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown calendarId "${sync.calendarId}" in syncStates`,
          path: ["syncStates", i, "calendarId"],
        });
      }
      if (seenSyncCalendars.has(sync.calendarId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate sync state for calendarId "${sync.calendarId}"`,
          path: ["syncStates", i, "calendarId"],
        });
      }
      seenSyncCalendars.add(sync.calendarId);
    }
  });

export type HolidayLibrarySnapshotV1 = z.infer<
  typeof holidayLibrarySnapshotSchema
>;

