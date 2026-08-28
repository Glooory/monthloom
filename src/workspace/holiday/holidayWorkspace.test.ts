import { describe, it, expect } from "vitest";
import { getWorkspaceHolidayDiagnostics } from "./holidayWorkspace";
import { fixtureLibrary } from "../../domain/holiday/testFixtures";
import { createDefaultHolidayLayers } from "../../domain/template/holidayLayer";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
} from "../../domain/holiday/types";

describe("holidayWorkspace", () => {
  it("computes holiday diagnostics including missing calendar warnings and coverage gaps", () => {
    const library = fixtureLibrary({
      calendars: [
        {
          id: BUILTIN_CHINA_CALENDAR_ID,
          name: "中国法定节假日",
          builtin: true,
          provider: "china-timor",
          createdAt: "2026-08-28T00:00:00.000Z",
          updatedAt: "2026-08-28T00:00:00.000Z",
        },
        {
          id: BUILTIN_JAPAN_CALENDAR_ID,
          name: "日本祝日",
          builtin: true,
          provider: "japan-holidays-jp",
          createdAt: "2026-08-28T00:00:00.000Z",
          updatedAt: "2026-08-28T00:00:00.000Z",
        },
      ],
      coverage: [], // No coverage records -> coverage gaps expected
    });
    const layers = createDefaultHolidayLayers();

    const diagnostics = getWorkspaceHolidayDiagnostics({
      targetYear: 2027,
      library,
      layers,
    });

    expect(diagnostics.some((d) => d.code === "holiday-coverage-gap")).toBe(
      true,
    );
  });

  it("reports missing calendar if layer references nonexistent calendar", () => {
    const library = fixtureLibrary({
      calendars: [], // No calendars
    });
    const layers = createDefaultHolidayLayers();

    const diagnostics = getWorkspaceHolidayDiagnostics({
      targetYear: 2027,
      library,
      layers,
    });

    expect(
      diagnostics.some((d) => d.code.startsWith("missing-calendar-")),
    ).toBe(true);
  });
});
