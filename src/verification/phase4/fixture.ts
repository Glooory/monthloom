import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { HolidayIndex, ResolvedHolidayDate } from "../../domain/holiday/types";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
} from "../../domain/holiday/types";

export const FIXTURE_HOLIDAYS_MAP: HolidayIndex = new Map<string, ResolvedHolidayDate>([
  ["2027-04-30", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "workday" as const }] }],
  ["2027-05-01", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "劳动节" }] }],
  ["2027-05-03", { occurrences: [{ layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "憲法記念日" }] }],
  ["2027-05-04", { occurrences: [{ layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "みどりの日" }] }],
  [
    "2027-05-05",
    {
      occurrences: [
        { layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "端午节" },
        { layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "こどもの日" },
      ],
    },
  ],
  ["2027-05-08", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "workday" as const }] }],
  ["2027-06-05", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "芒种" }] }],
]);

export function createPhase4FixtureCalendar(year = 2027, month = 5): CalendarMonth {
  return generateCalendarMonth(year, month, FIXTURE_HOLIDAYS_MAP);
}
