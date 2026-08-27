import { describe, expect, it } from "vitest";
import { buildHolidayIndex } from "./holidayIndex";
import type { HolidayDataset } from "./types";

describe("buildHolidayIndex", () => {
  it("merges China and Japan information on the same date", () => {
    const china: HolidayDataset = {
      source: "china-timor",
      entries: [
        {
          date: { year: 2027, month: 1, day: 1 },
          info: {
            china: {
              type: "holiday",
              name: "元旦",
            },
          },
        },
      ],
      coverage: { ranges: [] },
      diagnostics: [],
    };

    const japan: HolidayDataset = {
      source: "japan-holidays-jp",
      entries: [
        {
          date: { year: 2027, month: 1, day: 1 },
          info: {
            japan: {
              name: "元日",
            },
          },
        },
      ],
      coverage: { ranges: [] },
      diagnostics: [],
    };

    const index = buildHolidayIndex([china, japan]);

    expect(index.get("2027-01-01")).toEqual({
      china: {
        type: "holiday",
        name: "元旦",
      },
      japan: {
        name: "元日",
      },
    });
  });

  it("stores separate dates under strict zero-padded ISO keys", () => {
    const dataset: HolidayDataset = {
      source: "japan-holidays-jp",
      entries: [
        {
          date: { year: 2027, month: 5, day: 3 },
          info: { japan: { name: "憲法記念日" } },
        },
        {
          date: { year: 2027, month: 5, day: 4 },
          info: { japan: { name: "みどりの日" } },
        },
      ],
      coverage: { ranges: [] },
      diagnostics: [],
    };

    const index = buildHolidayIndex([dataset]);

    expect(index.size).toBe(2);
    expect(index.has("2027-05-03")).toBe(true);
    expect(index.has("2027-05-04")).toBe(true);
    expect(index.get("2027-05-03")).toEqual({ japan: { name: "憲法記念日" } });
    expect(index.get("2027-05-04")).toEqual({ japan: { name: "みどりの日" } });
  });
});
