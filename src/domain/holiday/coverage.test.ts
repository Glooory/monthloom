import { describe, expect, it } from "vitest";
import {
  calculateRequiredHolidayRange,
  createCalendarCoverageDiagnostics,
  getUncoveredCalendarRanges,
  isDateInConfirmedCoverage,
} from "./coverage";
import type { HolidayCalendar, HolidayCoverage } from "./types";

describe("coverage", () => {
  it("calculates required holiday range from Y-1 Dec to Y+1 Feb", () => {
    const range2027 = calculateRequiredHolidayRange(2027);
    expect(range2027).toEqual({
      start: { year: 2026, month: 12, day: 1 },
      end: { year: 2028, month: 2, day: 29 }, // 2028 is leap year
    });

    const range2026 = calculateRequiredHolidayRange(2026);
    expect(range2026).toEqual({
      start: { year: 2025, month: 12, day: 1 },
      end: { year: 2027, month: 2, day: 28 }, // 2027 is common year
    });
  });

  it("checks confirmed coverage for a specific calendar", () => {
    const coverageList: HolidayCoverage[] = [
      {
        id: "cov-1",
        calendarId: "cn",
        start: { year: 2027, month: 1, day: 1 },
        end: { year: 2027, month: 12, day: 31 },
        status: "confirmed",
        source: "sync",
        updatedAt: "2026-08-28T00:00:00.000Z",
      },
      {
        id: "cov-2",
        calendarId: "jp",
        start: { year: 2027, month: 1, day: 1 },
        end: { year: 2027, month: 12, day: 31 },
        status: "unconfirmed",
        source: "sync",
        updatedAt: "2026-08-28T00:00:00.000Z",
      },
    ];

    expect(
      isDateInConfirmedCoverage({ year: 2027, month: 5, day: 1 }, coverageList, "cn"),
    ).toBe(true);

    expect(
      isDateInConfirmedCoverage({ year: 2027, month: 5, day: 1 }, coverageList, "jp"),
    ).toBe(false); // unconfirmed status returns false

    expect(
      isDateInConfirmedCoverage({ year: 2028, month: 1, day: 1 }, coverageList, "cn"),
    ).toBe(false);
  });

  it("finds uncovered gaps and generates diagnostic messages for calendar", () => {
    const calendar: HolidayCalendar = {
      id: "cn",
      name: "中国公众假期",
      builtin: true,
      provider: "china-timor",
      createdAt: "2026-08-28T00:00:00.000Z",
      updatedAt: "2026-08-28T00:00:00.000Z",
    };

    const required = calculateRequiredHolidayRange(2027);
    const coverageList: HolidayCoverage[] = [
      {
        id: "cov-1",
        calendarId: "cn",
        start: { year: 2027, month: 1, day: 1 },
        end: { year: 2027, month: 12, day: 31 },
        status: "confirmed",
        source: "sync",
        updatedAt: "2026-08-28T00:00:00.000Z",
      },
    ];

    const gaps = getUncoveredCalendarRanges(required, coverageList, "cn");
    expect(gaps).toEqual([
      {
        start: { year: 2026, month: 12, day: 1 },
        end: { year: 2026, month: 12, day: 31 },
      },
      {
        start: { year: 2028, month: 1, day: 1 },
        end: { year: 2028, month: 2, day: 29 },
      },
    ]);

    const diagnostics = createCalendarCoverageDiagnostics({
      calendar,
      requiredRange: required,
      coverage: coverageList,
    });

    expect(diagnostics).toEqual([
      {
        level: "warning",
        code: "holiday-coverage-gap",
        message: "中国公众假期 holiday data does not cover 2026-12-01 through 2026-12-31.",
      },
      {
        level: "warning",
        code: "holiday-coverage-gap",
        message: "中国公众假期 holiday data does not cover 2028-01-01 through 2028-02-29.",
      },
    ]);
  });
});
