import { calculateRequiredHolidayRange } from "../../domain/calendar/monthSequence";
import { createCalendarCoverageDiagnostics } from "../../domain/holiday/coverage";
import type {
  HolidayDiagnostic,
  HolidayLibrarySnapshot,
} from "../../domain/holiday/types";
import type { HolidayLayer } from "../../domain/template/holidayLayer";

export function getWorkspaceHolidayDiagnostics(args: {
  targetYear: number;
  library: HolidayLibrarySnapshot;
  layers: readonly HolidayLayer[];
  includeMini?: boolean;
  mainStartOfWeek?: 0 | 1;
}): readonly HolidayDiagnostic[] {
  const { targetYear, library, layers } = args;
  const diagnostics: HolidayDiagnostic[] = [];
  const requiredRange = calculateRequiredHolidayRange(targetYear, args);

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
