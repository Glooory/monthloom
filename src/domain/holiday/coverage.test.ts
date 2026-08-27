import { describe, expect, it } from "vitest";
import {
  createCoverageDiagnostics,
  getUncoveredRanges,
  isDateCovered,
} from "./coverage";

describe("coverage", () => {
  it("checks coverage across multiple ranges", () => {
    const coverage = {
      ranges: [
        {
          start: { year: 2026, month: 1, day: 1 },
          end: { year: 2026, month: 12, day: 31 },
        },
        {
          start: { year: 2027, month: 1, day: 1 },
          end: { year: 2027, month: 12, day: 31 },
        },
      ],
    };

    expect(
      isDateCovered({ year: 2026, month: 5, day: 1 }, coverage),
    ).toBe(true);

    expect(
      isDateCovered({ year: 2028, month: 1, day: 1 }, coverage),
    ).toBe(false);
  });

  it("finds uncovered contiguous ranges when coverage is partial", () => {
    const required = {
      start: { year: 2026, month: 12, day: 1 },
      end: { year: 2028, month: 2, day: 29 },
    };

    const coverage = {
      ranges: [
        {
          start: { year: 2027, month: 1, day: 1 },
          end: { year: 2027, month: 12, day: 31 },
        },
      ],
    };

    const gaps = getUncoveredRanges(required, coverage);

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
  });

  it("returns an empty array when required range is completely covered", () => {
    const required = {
      start: { year: 2027, month: 1, day: 1 },
      end: { year: 2027, month: 12, day: 31 },
    };

    const coverage = {
      ranges: [
        {
          start: { year: 2026, month: 1, day: 1 },
          end: { year: 2028, month: 12, day: 31 },
        },
      ],
    };

    expect(getUncoveredRanges(required, coverage)).toEqual([]);
  });

  it("creates explicit warning diagnostics for coverage gaps", () => {
    const required = {
      start: { year: 2026, month: 12, day: 1 },
      end: { year: 2028, month: 2, day: 29 },
    };

    const coverage = {
      ranges: [
        {
          start: { year: 2027, month: 1, day: 1 },
          end: { year: 2027, month: 12, day: 31 },
        },
      ],
    };

    const diagnostics = createCoverageDiagnostics(
      "japan-holidays-jp",
      required,
      coverage,
    );

    expect(diagnostics).toEqual([
      {
        level: "warning",
        code: "holiday-coverage-gap",
        message:
          "japan-holidays-jp holiday data does not cover 2026-12-01 through 2026-12-31.",
      },
      {
        level: "warning",
        code: "holiday-coverage-gap",
        message:
          "japan-holidays-jp holiday data does not cover 2028-01-01 through 2028-02-29.",
      },
    ]);
  });
});
