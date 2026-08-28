import { calculateRequiredHolidayRange } from "../../domain/calendar/monthSequence";
import { createCoverageDiagnostics } from "../../domain/holiday/coverage";
import { buildHolidayIndex } from "../../domain/holiday/holidayIndex";
import type {
  HolidayDataset,
  HolidayDiagnostic,
  HolidayIndex,
} from "../../domain/holiday/types";
import { getT } from "../../shared/i18n/i18nStore";

export function computeWorkspaceHolidayIndex(args: {
  chinaHolidayDataset: HolidayDataset | null;
  japanHolidayDataset: HolidayDataset | null;
}): HolidayIndex {
  const datasets: HolidayDataset[] = [];
  if (args.chinaHolidayDataset) {
    datasets.push(args.chinaHolidayDataset);
  }
  if (args.japanHolidayDataset) {
    datasets.push(args.japanHolidayDataset);
  }
  return buildHolidayIndex(datasets);
}

export function getWorkspaceHolidayDiagnostics(args: {
  targetYear: number;
  chinaHolidayDataset: HolidayDataset | null;
  japanHolidayDataset: HolidayDataset | null;
}): readonly HolidayDiagnostic[] {
  const { targetYear, chinaHolidayDataset, japanHolidayDataset } = args;
  const diagnostics: HolidayDiagnostic[] = [];
  const t = getT();

  const requiredRange = calculateRequiredHolidayRange(targetYear);

  if (!chinaHolidayDataset) {
    diagnostics.push({
      level: "warning",
      code: "china-dataset-missing",
      message: t.workspace.missingChinaDataset,
    });
  } else {
    diagnostics.push(
      ...createCoverageDiagnostics(
        "china-timor",
        requiredRange,
        chinaHolidayDataset.coverage,
      ),
    );
    diagnostics.push(...chinaHolidayDataset.diagnostics);
  }

  if (!japanHolidayDataset) {
    diagnostics.push({
      level: "warning",
      code: "japan-dataset-missing",
      message: t.workspace.missingJapanDataset,
    });
  } else {
    diagnostics.push(
      ...createCoverageDiagnostics(
        "japan-holidays-jp",
        requiredRange,
        japanHolidayDataset.coverage,
      ),
    );
    diagnostics.push(...japanHolidayDataset.diagnostics);
  }

  return diagnostics;
}
