import { describe, expect, it } from "vitest";
import { generateCalendarMonth } from "./generateCalendarMonth";

describe("generateCalendarMonth", () => {
  it("generates a 4-week month when 28 days start on Sunday", () => {
    const month = generateCalendarMonth(2026, 2);

    expect(month.weekCount).toBe(4);
    expect(month.weeks).toHaveLength(4);
    expect(month.weeks.flat()).toHaveLength(28);
    expect(month.weeks[0][0]).toMatchObject({
      date: { year: 2026, month: 2, day: 1 },
      dayOfWeek: 0,
      inCurrentMonth: true,
    });
  });

  it("fills leading and trailing cells with real adjacent dates", () => {
    const month = generateCalendarMonth(2027, 1);

    expect(month.weeks[0][0].date).toEqual({
      year: 2026,
      month: 12,
      day: 27,
    });

    expect(month.weeks[0][0].inCurrentMonth).toBe(false);

    const cells = month.weeks.flat();

    expect(
      cells.some(
        (cell) =>
          cell.date.year === 2027 &&
          cell.date.month === 2 &&
          cell.inCurrentMonth === false,
      ),
    ).toBe(true);
  });

  it("handles 5-week and 6-week months correctly and ensures 7 cells per week", () => {
    const month5 = generateCalendarMonth(2027, 2);
    expect(month5.weekCount).toBe(5);
    expect(month5.weeks).toHaveLength(5);
    for (const week of month5.weeks) {
      expect(week).toHaveLength(7);
    }

    const month6 = generateCalendarMonth(2027, 5);
    expect(month6.weekCount).toBe(6);
    expect(month6.weeks).toHaveLength(6);
    for (const week of month6.weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("enriches calendar cells with normalized holiday info for both current and adjacent months", () => {
    const holidays = new Map([
      [
        "2027-01-01",
        {
          china: { type: "holiday" as const, name: "元旦" },
          japan: { name: "元日" },
        },
      ],
      [
        "2026-12-31",
        {
          japan: { name: "大晦日" },
        },
      ],
    ]);

    const month = generateCalendarMonth(2027, 1, holidays);
    const cells = month.weeks.flat();

    const jan1 = cells.find(
      (c) =>
        c.date.year === 2027 &&
        c.date.month === 1 &&
        c.date.day === 1,
    );
    expect(jan1?.holiday).toEqual({
      china: { type: "holiday", name: "元旦" },
      japan: { name: "元日" },
    });

    const dec31 = cells.find(
      (c) =>
        c.date.year === 2026 &&
        c.date.month === 12 &&
        c.date.day === 31,
    );
    expect(dec31).toBeDefined();
    expect(dec31?.inCurrentMonth).toBe(false);
    expect(dec31?.holiday).toEqual({
      japan: { name: "大晦日" },
    });
  });

  it("supports startOfWeek: 1 (Monday start) correctly", () => {
    // 2027-02-01 is Monday
    const monthMon = generateCalendarMonth(2027, 2, undefined, 1);
    expect(monthMon.startOfWeek).toBe(1);
    // 2027-02-01 is Monday, so col 0 of week 0 is 2027-02-01
    expect(monthMon.weeks[0][0].date).toEqual({ year: 2027, month: 2, day: 1 });
    expect(monthMon.weeks[0][0].dayOfWeek).toBe(1);
    expect(monthMon.weeks[0][0].inCurrentMonth).toBe(true);

    // 2027-01-01 is Friday
    // With startOfWeek = 1 (Mon start): offset from Mon to Fri is 4 days (Mon Dec 28, Tue 29, Wed 30, Thu 31)
    const monthJan = generateCalendarMonth(2027, 1, undefined, 1);
    expect(monthJan.weeks[0][0].date).toEqual({ year: 2026, month: 12, day: 28 });
    expect(monthJan.weeks[0][0].dayOfWeek).toBe(1);
    expect(monthJan.weeks[0][4].date).toEqual({ year: 2027, month: 1, day: 1 });
    expect(monthJan.weeks[0][4].dayOfWeek).toBe(5);
  });

  it("rejects invalid month numbers", () => {
    expect(() => generateCalendarMonth(2027, 0)).toThrow(RangeError);
    expect(() => generateCalendarMonth(2027, 13)).toThrow(RangeError);
  });
});
