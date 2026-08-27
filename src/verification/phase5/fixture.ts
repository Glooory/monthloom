import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { HolidayDiagnostic, HolidayIndex, HolidayInfo } from "../../domain/holiday/types";

export const PHASE5_FIXTURE_HOLIDAYS_MAP: HolidayIndex = new Map<string, HolidayInfo>([
  // 2026-12 (Boundary previous year)
  ["2026-12-25", { china: { type: "holiday", name: "圣诞节" } }],

  // 2027-01 (Target year start)
  ["2027-01-01", { china: { type: "holiday", name: "元旦" }, japan: { name: "元日" } }],

  // 2027-04 (adjacent)
  ["2027-04-30", { china: { type: "workday" } }],

  // 2027-05 (6-week month)
  ["2027-05-01", { china: { type: "holiday", name: "劳动节" } }],
  ["2027-05-03", { japan: { name: "憲法記念日" } }],
  ["2027-05-04", { japan: { name: "みどりの日" } }],
  [
    "2027-05-05",
    {
      china: { type: "holiday", name: "端午节" },
      japan: { name: "こどもの日" },
    },
  ],
  ["2027-05-08", { china: { type: "workday" } }],

  // 2027-10 (National Day)
  ["2027-10-01", { china: { type: "holiday", name: "国庆节" } }],

  // 2027-12
  ["2027-12-31", { china: { type: "workday" } }],

  // 2028-01 (Formal 13th month)
  ["2028-01-01", { china: { type: "holiday", name: "元旦" }, japan: { name: "元日" } }],

  // 2028-02 (Formal 15th mini month, leap-year February)
  ["2028-02-11", { japan: { name: "建国記念の日" } }],
  ["2028-02-29", { china: { type: "holiday", name: "闰日" } }],
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
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
      <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
      </pattern>
    </defs>
    <rect width="1600" height="1000" fill="url(#bgGrad)"/>
    <rect width="1600" height="1000" fill="url(#gridPattern)"/>
    <circle cx="150" cy="150" r="100" fill="#38bdf8" opacity="0.08"/>
    <circle cx="1450" cy="850" r="120" fill="#818cf8" opacity="0.08"/>
    <rect x="0" y="0" width="1600" height="1000" fill="none" stroke="#38bdf8" stroke-width="8" opacity="0.4"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
