import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
  type HolidayDiagnostic,
} from "../../domain/holiday/types";
import type { TranslationDictionary } from "./types";

export function formatHolidayDiagnostic(diagnostic: HolidayDiagnostic, t: TranslationDictionary): string {
  const gap = diagnostic.coverageGap;
  if (diagnostic.code !== "holiday-coverage-gap" || !gap) return diagnostic.message;
  const name = gap.calendarId === BUILTIN_CHINA_CALENDAR_ID
    ? t.workspace.chinaPublicHolidays
    : gap.calendarId === BUILTIN_JAPAN_CALENDAR_ID
      ? t.workspace.japanPublicHolidays
      : gap.calendarName;
  return t.workspace.holidayCoverageGap(name, gap.start, gap.end);
}
