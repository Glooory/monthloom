import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { HolidayDiagnostic, HolidayIndex, ResolvedHolidayDate } from "../../domain/holiday/types";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
} from "../../domain/holiday/types";

export const PHASE5_FIXTURE_HOLIDAYS_MAP: HolidayIndex = new Map<string, ResolvedHolidayDate>([
  // 2026-12 (Boundary previous year)
  ["2026-12-25", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "圣诞节" }] }],

  // 2027-01 (Target year start)
  [
    "2027-01-01",
    {
      occurrences: [
        { layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "元旦" },
        { layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "元日" },
      ],
    },
  ],

  // 2027-04 (adjacent)
  ["2027-04-30", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "workday" as const }] }],

  // 2027-05 (6-week month)
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

  // 2027-10 (National Day)
  ["2027-10-01", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "国庆节" }] }],

  // 2027-12
  ["2027-12-31", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "workday" as const }] }],

  // 2028-01 (Formal 13th month)
  [
    "2028-01-01",
    {
      occurrences: [
        { layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "元旦" },
        { layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "元日" },
      ],
    },
  ],

  // 2028-02 (Formal 15th mini month, leap-year February)
  ["2028-02-11", { occurrences: [{ layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "建国記念の日" }] }],
  ["2028-02-29", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "闰日" }] }],
]);

export const PHASE5_FIXTURE_DIAGNOSTICS: readonly HolidayDiagnostic[] = [
  {
    code: "holiday-coverage-note",
    level: "warning",
    message: "2027–2028 cross-boundary holiday dataset loaded for Preview testing.",
  },
];

export function createPhase5FixtureCalendar(year = 2027, month = 5): CalendarMonth {
  return generateCalendarMonth(year, month, PHASE5_FIXTURE_HOLIDAYS_MAP);
}

// Generate a high-contrast decorative background pattern (SVG as Data URI)
export function createFixtureBackgroundDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <pattern id="dotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="#38bdf8" fill-opacity="0.15"/>
      </pattern>
    </defs>
    <rect width="1600" height="1000" fill="url(#bgGrad)"/>
    <rect width="1600" height="1000" fill="url(#dotGrid)"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
