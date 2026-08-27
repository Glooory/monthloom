import { describe, it, expect } from "vitest";
import type { HolidayDataset } from "../../domain/holiday/types";
import {
  computeWorkspaceHolidayIndex,
  getWorkspaceHolidayDiagnostics,
} from "./holidayWorkspace";

describe("holidayWorkspace", () => {
  const chinaMock: HolidayDataset = {
    source: "china-timor",
    entries: [
      {
        date: { year: 2027, month: 1, day: 1 },
        info: { china: { type: "holiday", name: "元旦" } },
      },
    ],
    coverage: {
      ranges: [
        {
          start: { year: 2026, month: 12, day: 1 },
          end: { year: 2028, month: 2, day: 29 },
        },
      ],
    },
    diagnostics: [],
  };

  const japanMock: HolidayDataset = {
    source: "japan-holidays-jp",
    entries: [
      {
        date: { year: 2027, month: 1, day: 1 },
        info: { japan: { name: "元日" } },
      },
    ],
    coverage: {
      ranges: [
        {
          start: { year: 2026, month: 12, day: 1 },
          end: { year: 2028, month: 2, day: 29 },
        },
      ],
    },
    diagnostics: [],
  };

  it("builds a unified HolidayIndex when both datasets are present", () => {
    const index = computeWorkspaceHolidayIndex({
      chinaHolidayDataset: chinaMock,
      japanHolidayDataset: japanMock,
    });

    const jan1 = index.get("2027-01-01");
    expect(jan1).toEqual({
      china: { type: "holiday", name: "元旦" },
      japan: { name: "元日" },
    });
  });

  it("builds HolidayIndex when only one dataset is present", () => {
    const index = computeWorkspaceHolidayIndex({
      chinaHolidayDataset: chinaMock,
      japanHolidayDataset: null,
    });

    const jan1 = index.get("2027-01-01");
    expect(jan1).toEqual({
      china: { type: "holiday", name: "元旦" },
    });
  });

  it("computes holiday diagnostics including missing dataset warnings and coverage gaps", () => {
    const diagnostics = getWorkspaceHolidayDiagnostics({
      targetYear: 2027,
      chinaHolidayDataset: null,
      japanHolidayDataset: {
        ...japanMock,
        coverage: {
          ranges: [
            {
              start: { year: 2027, month: 1, day: 1 },
              end: { year: 2027, month: 12, day: 31 },
            },
          ],
        },
      },
    });

    expect(diagnostics.some((d) => d.code === "china-dataset-missing")).toBe(true);
    expect(diagnostics.some((d) => d.code === "holiday-coverage-gap")).toBe(true);
  });
});
