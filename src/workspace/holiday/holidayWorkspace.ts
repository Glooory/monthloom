import {
  calculateRequiredHolidayRange,
  createCalendarCoverageDiagnostics,
} from "../../domain/holiday/coverage";
import type {
  HolidayDiagnostic,
  HolidayLibrarySnapshot,
} from "../../domain/holiday/types";
import type { HolidayLayer } from "../../domain/template/holidayLayer";

export function getWorkspaceHolidayDiagnostics(args: {
  targetYear: number;
  library: HolidayLibrarySnapshot;
  layers: readonly HolidayLayer[];
}): readonly HolidayDiagnostic[] {
  const { targetYear, library, layers } = args;
  const diagnostics: HolidayDiagnostic[] = [];
  const requiredRange = calculateRequiredHolidayRange(targetYear);

  for (const layer of layers) {
    if (!layer.enabled) continue;
    const calendar = library.calendars.find((c) => c.id === layer.calendarId);
    if (!calendar) {
      diagnostics.push({
        level: "warning",
        code: `missing-calendar-${layer.calendarId}`,
        message: `Holiday calendar "${layer.calendarId}" referenced by holiday layer is missing from the global library.`,
      });
      continue;
    }

    const calendarCoverage = library.coverage.filter(
      (c) => c.calendarId === layer.calendarId,
    );
    const coverageDiags = createCalendarCoverageDiagnostics({
      calendar,
      requiredRange,
      coverage: calendarCoverage,
    });
    diagnostics.push(...coverageDiags);
  }

  return diagnostics;
}
