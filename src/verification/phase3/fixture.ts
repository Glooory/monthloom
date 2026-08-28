import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { AssetResolver, BinaryAsset } from "../../resources/assets/types";
import type { FontCatalog } from "../../resources/fonts/types";
import type { HolidayIndex, ResolvedHolidayDate } from "../../domain/holiday/types";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
} from "../../domain/holiday/types";

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

export const FIXTURE_HOLIDAYS: HolidayIndex = new Map<string, ResolvedHolidayDate>([
  // 2026-02 (4-week month)
  ["2026-02-11", { occurrences: [{ layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "建国記念の日" }] }],
  ["2026-02-17", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "春节" }] }],
  ["2026-02-15", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "workday" as const }] }],

  // 2027-02 (5-week month)
  ["2027-02-06", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "春节" }] }],
  ["2027-02-11", { occurrences: [{ layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "建国記念の日" }] }],
  ["2027-02-14", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "workday" as const }] }],

  // 2027-05 (6-week month)
  ["2027-04-30", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "workday" as const }] }],
  ["2027-05-01", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "劳动节" }] }],
  ["2027-05-03", { occurrences: [{ layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "憲法記念日" }] }],
  ["2027-05-04", { occurrences: [{ layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "みどりの日" }] }],
  [
    "2027-05-05",
    {
      occurrences: [
        { layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "端午节" },
        { layerId: "jp", calendarId: BUILTIN_JAPAN_CALENDAR_ID, type: "holiday" as const, name: "こどもの日" },
      ],
    },
  ],
  ["2027-05-08", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "workday" as const }] }],
  ["2027-06-05", { occurrences: [{ layerId: "cn", calendarId: BUILTIN_CHINA_CALENDAR_ID, type: "holiday" as const, name: "芒种" }] }],
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
  colors: {
    ...DEFAULT_MAIN_TEMPLATE.colors,
    sunday: "#dc2626",
    saturday: "#2563eb",
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
        fontWeight: 700,
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
  const assets = new Map<string, BinaryAsset>();

  // A tiny valid 1x1 PNG or mock icon for image marker testing
  const dummyPngData = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  assets.set("phase3-marker", {
    mimeType: "image/png",
    bytes: dummyPngData.buffer,
  });

  return {
    async resolve(id: string): Promise<BinaryAsset> {
      const asset = assets.get(id);
      if (!asset) {
        throw new Error(`Asset not found: ${id}`);
      }
      return asset;
    },
  };
}
