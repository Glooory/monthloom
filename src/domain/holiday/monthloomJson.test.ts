import { describe, expect, it } from "vitest";
import {
  parseMonthloomHolidayJson,
  serializeMonthloomHolidayJson,
} from "./monthloomJson";
import type { EffectiveHolidayRecord, HolidayCalendar } from "./types";

describe("Monthloom Holiday JSON Exchange", () => {
  const sampleCalendar: HolidayCalendar = {
    id: "custom-us",
    name: "US Federal Holidays",
    builtin: false,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  };

  const sampleRecords: EffectiveHolidayRecord[] = [
    {
      calendarId: "custom-us",
      date: { year: 2027, month: 1, day: 1 },
      type: "holiday",
      name: "New Year's Day",
      provenance: "source",
    },
    {
      calendarId: "custom-us",
      date: { year: 2027, month: 7, day: 4 },
      type: "holiday",
      name: "Independence Day",
      provenance: "manual-added",
    },
  ];

  it("serializes and parses valid Monthloom Holiday JSON without data loss", () => {
    const jsonString = serializeMonthloomHolidayJson({
      calendar: sampleCalendar,
      records: sampleRecords,
      coverage: [
        {
          id: "cov-1",
          calendarId: "custom-us",
          start: { year: 2027, month: 1, day: 1 },
          end: { year: 2027, month: 12, day: 31 },
          status: "confirmed",
          source: "manual",
          updatedAt: "2026-08-28T00:00:00.000Z",
        },
      ],
    });

    const parsed = parseMonthloomHolidayJson(JSON.parse(jsonString));
    expect(parsed.calendar.id).toBe("custom-us");
    expect(parsed.calendar.name).toBe("US Federal Holidays");
    expect(parsed.records).toHaveLength(2);
    expect(parsed.records[0].date).toEqual({ year: 2027, month: 1, day: 1 });
    expect(parsed.records[0].name).toBe("New Year's Day");
    expect(parsed.coverage).toHaveLength(1);
    expect(parsed.coverage[0].status).toBe("confirmed");
  });

  it("rejects JSON containing duplicate dates", () => {
    const raw = {
      format: "monthloom-holidays",
      version: 1,
      calendar: { id: "custom", name: "Custom" },
      records: [
        { date: "2027-01-01", type: "holiday", name: "Day 1" },
        { date: "2027-01-01", type: "workday" },
      ],
    };

    expect(() => parseMonthloomHolidayJson(raw)).toThrow(/Duplicate date/);
  });

  it("rejects invalid format version or date strings", () => {
    const invalidVersion = {
      format: "monthloom-holidays",
      version: 2,
      calendar: { id: "custom", name: "Custom" },
      records: [],
    };
    expect(() => parseMonthloomHolidayJson(invalidVersion)).toThrow();

    const invalidDate = {
      format: "monthloom-holidays",
      version: 1,
      calendar: { id: "custom", name: "Custom" },
      records: [{ date: "not-a-date", type: "holiday" }],
    };
    expect(() => parseMonthloomHolidayJson(invalidDate)).toThrow();
  });

  it("rejects JSON containing reversed coverage ranges (start > end)", () => {
    const reversedCoverageJson = {
      format: "monthloom-holidays",
      version: 1,
      calendar: { id: "custom", name: "Custom" },
      coverage: [
        {
          start: "2027-12-31",
          end: "2027-01-01",
          status: "confirmed",
        },
      ],
      records: [],
    };

    expect(() => parseMonthloomHolidayJson(reversedCoverageJson)).toThrow(
      /Coverage start date must be before or equal to end date/,
    );
  });
});

