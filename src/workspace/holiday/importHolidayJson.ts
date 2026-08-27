import { parseChinaTimorHolidayYear } from "../../domain/holiday/adapters/chinaTimorHolidayAdapter";
import { parseJapanHolidaysJp } from "../../domain/holiday/adapters/japanHolidaysJpAdapter";
import type { HolidayDataset } from "../../domain/holiday/types";

export function parseChinaHolidayJsonString(jsonText: string): HolidayDataset {
  try {
    const raw = JSON.parse(jsonText);
    return parseChinaTimorHolidayYear(raw);
  } catch (error) {
    return {
      source: "china-timor",
      entries: [],
      coverage: { ranges: [] },
      diagnostics: [
        {
          level: "error",
          code: "invalid-json",
          message: `Failed to parse China holiday JSON: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

export function parseJapanHolidayJsonString(jsonText: string): HolidayDataset {
  try {
    const raw = JSON.parse(jsonText);
    return parseJapanHolidaysJp(raw);
  } catch (error) {
    return {
      source: "japan-holidays-jp",
      entries: [],
      coverage: { ranges: [] },
      diagnostics: [
        {
          level: "error",
          code: "invalid-json",
          message: `Failed to parse Japan holiday JSON: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
