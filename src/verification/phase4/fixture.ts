import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { HolidayInfo, HolidayIndex } from "../../domain/holiday/types";

export const FIXTURE_HOLIDAYS_MAP: HolidayIndex = new Map<string, HolidayInfo>([
  // 2027-04 (adjacent previous month)
  ["2027-04-30", { china: { type: "workday" } }],

  // 2027-05 (6-week month with all test cases)
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

  // 2027-06 (adjacent next month)
  ["2027-06-05", { china: { type: "holiday", name: "芒种" } }],
]);

export function createPhase4FixtureCalendar(year = 2027, month = 5): CalendarMonth {
  return generateCalendarMonth(year, month, FIXTURE_HOLIDAYS_MAP);
}
