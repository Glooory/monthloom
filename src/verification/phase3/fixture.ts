import type { HolidayInfo } from "../../domain/holiday/types";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { AssetResolver, BinaryAsset } from "../../resources/assets/types";
import type { FontCatalog } from "../../resources/fonts/types";

export const PHASE3_FONT_CATALOG: FontCatalog = {
  "font-en": {
    family: "Noto Sans",
    weight: 400,
    style: "normal",
    source: { type: "google", family: "Noto Sans" },
  },
  "font-zh": {
    family: "Noto Sans SC",
    weight: 400,
    style: "normal",
    source: { type: "google", family: "Noto Sans SC" },
  },
  "font-ja": {
    family: "Noto Sans JP",
    weight: 400,
    style: "normal",
    source: { type: "google", family: "Noto Sans JP" },
  },
};

export const SAMPLE_MONTHS = [
  { year: 2026, month: 2, label: "2026-02 (4 weeks)" },
  { year: 2027, month: 2, label: "2027-02 (5 weeks)" },
  { year: 2027, month: 5, label: "2027-05 (6 weeks)" },
] as const;

export const FIXTURE_HOLIDAYS = new Map<string, HolidayInfo>([
  // 2026-02 (4-week month)
  ["2026-02-11", { japan: { name: "建国記念の日" } }],
  ["2026-02-17", { china: { type: "holiday", name: "春节" } }],
  ["2026-02-15", { china: { type: "workday" } }],

  // 2027-02 (5-week month)
  ["2027-02-06", { china: { type: "holiday", name: "春节" } }],
  ["2027-02-11", { japan: { name: "建国記念の日" } }],
  ["2027-02-14", { china: { type: "workday" } }],

  // 2027-05 (6-week month)
  ["2027-04-30", { china: { type: "workday" } }], // adjacent previous month
  ["2027-05-01", { china: { type: "holiday", name: "劳动节" } }],
  ["2027-05-03", { japan: { name: "憲法記念日" } }],
  ["2027-05-04", { japan: { name: "みどりの日" } }],
  [
    "2027-05-05",
    {
      china: { type: "holiday", name: "端午节" },
      japan: { name: "こどもの日" },
    },
  ], // coexisting same-date
  ["2027-05-08", { china: { type: "workday" } }],
  ["2027-06-05", { china: { type: "holiday", name: "芒种" } }], // adjacent next month
]);

export const PHASE3_MAIN_TEMPLATE: MainTemplate = {
  ...DEFAULT_MAIN_TEMPLATE,
  weekdayRow: {
    ...DEFAULT_MAIN_TEMPLATE.weekdayRow,
    weekday: {
      ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday,
      typography: {
        ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday.typography,
        fontId: "font-en",
        fontWeight: 400,
      },
    },
  },
  date: {
    ...DEFAULT_MAIN_TEMPLATE.date,
    typography: {
      ...DEFAULT_MAIN_TEMPLATE.date.typography,
      fontId: "font-en",
      fontWeight: 400,
    },
  },
  chinaHolidayName: {
    ...DEFAULT_MAIN_TEMPLATE.chinaHolidayName,
    typography: {
      ...DEFAULT_MAIN_TEMPLATE.chinaHolidayName.typography,
      fontId: "font-zh",
      fontWeight: 400,
    },
  },
  japanHolidayName: {
    ...DEFAULT_MAIN_TEMPLATE.japanHolidayName,
    typography: {
      ...DEFAULT_MAIN_TEMPLATE.japanHolidayName.typography,
      fontId: "font-ja",
      fontWeight: 400,
    },
  },
  chinaMarkers: {
    holiday: {
      type: "text",
      value: "休",
      position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
      typography: {
        fontId: "font-zh",
        fontSize: 10,
        fontWeight: 400,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#DC2626",
        opacity: 1,
      },
    },
    workday: {
      type: "text",
      value: "班",
      position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
      typography: {
        fontId: "font-zh",
        fontSize: 10,
        fontWeight: 400,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#4B5563",
        opacity: 1,
      },
    },
  },
};

export const PHASE3_MINI_TEMPLATE: MiniTemplate = {
  ...DEFAULT_MINI_TEMPLATE,
  monthRow: {
    ...DEFAULT_MINI_TEMPLATE.monthRow,
    label: {
      ...DEFAULT_MINI_TEMPLATE.monthRow.label,
      typography: {
        ...DEFAULT_MINI_TEMPLATE.monthRow.label.typography,
        fontId: "font-en",
        fontWeight: 400,
      },
    },
  },
  weekdayRow: {
    ...DEFAULT_MINI_TEMPLATE.weekdayRow,
    weekday: {
      ...DEFAULT_MINI_TEMPLATE.weekdayRow.weekday,
      typography: {
        ...DEFAULT_MINI_TEMPLATE.weekdayRow.weekday.typography,
        fontId: "font-en",
        fontWeight: 400,
      },
    },
  },
  date: {
    ...DEFAULT_MINI_TEMPLATE.date,
    typography: {
      ...DEFAULT_MINI_TEMPLATE.date.typography,
      fontId: "font-en",
      fontWeight: 400,
    },
  },
};

export function createPhase3AssetResolver(): AssetResolver {
  const cache = new Map<string, BinaryAsset>();

  return {
    async resolve(assetId: string): Promise<BinaryAsset> {
      if (cache.has(assetId)) {
        return cache.get(assetId)!;
      }

      if (assetId === "phase3-marker") {
        const baseUrl = import.meta.env.BASE_URL || "/";
        const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
        const markerUrl = `${cleanBase}phase3-marker.png`;

        const response = await fetch(markerUrl);
        if (!response.ok) {
          throw new Error(`Failed to load marker image from ${markerUrl}: HTTP ${response.status}`);
        }

        const bytes = await response.arrayBuffer();
        const asset: BinaryAsset = {
          bytes,
          mimeType: "image/png",
        };
        cache.set(assetId, asset);
        return asset;
      }

      throw new Error(`Unknown assetId: "${assetId}"`);
    },
  };
}
