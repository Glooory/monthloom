import { z } from "zod";

const localDateSchema = z.object({
  year: z.number(),
  month: z.number(),
  day: z.number(),
});

const dateRangeSchema = z.object({
  start: localDateSchema,
  end: localDateSchema,
});

const holidayDiagnosticSchema = z.object({
  level: z.enum(["warning", "error"]),
  code: z.string(),
  message: z.string(),
});

const holidayDatasetSchema = z.object({
  source: z.enum(["china-timor", "japan-holidays-jp"]),
  entries: z.array(
    z.object({
      date: localDateSchema,
      info: z.object({
        china: z
          .object({
            type: z.enum(["holiday", "workday"]),
            name: z.string().optional(),
          })
          .optional(),
        japan: z
          .object({
            name: z.string(),
          })
          .optional(),
      }),
    }),
  ),
  coverage: z.object({
    ranges: z.array(dateRangeSchema),
  }),
  diagnostics: z.array(holidayDiagnosticSchema),
});

const fontDescriptorSchema = z.object({
  family: z.string(),
  weight: z.number(),
  style: z.enum(["normal", "italic"]),
  source: z.union([
    z.object({
      type: z.literal("google"),
      family: z.string(),
    }),
    z.object({
      type: z.literal("local"),
      assetId: z.string(),
    }),
  ]),
});

const fontCatalogSchema = z.record(z.string(), fontDescriptorSchema);

const typographySchema = z.object({
  fontId: z.string(),
  fontSize: z.number(),
  fontWeight: z.number().optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  letterSpacing: z.number().optional(),
  color: z.string(),
  opacity: z.number().optional(),
});

const positionOffsetSchema = z.object({
  anchor: z.enum([
    "top-left",
    "top-center",
    "top-right",
    "center-left",
    "center",
    "center-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]),
  offsetX: z.number(),
  offsetY: z.number(),
});

const markerStyleSchema = z.object({
  type: z.enum(["text", "image"]),
  value: z.string().optional(),
  assetId: z.string().optional(),
  position: positionOffsetSchema,
  typography: typographySchema.optional(),
  size: z.number().optional(),
});

const dotMarkerStyleSchema = z.object({
  position: positionOffsetSchema,
  size: z.number(),
  color: z.string(),
  opacity: z.number().optional(),
});

const mainTemplateSchema = z.object({
  width: z.number(),
  height: z.number(),
  weekdayRow: z.object({
    height: z.number(),
    labels: z.array(z.string()).optional(),
    weekday: z.object({
      position: positionOffsetSchema,
      typography: typographySchema,
    }),
  }),
  dateGrid: z.object({
    borderWidth: z.number(),
    borderColor: z.string(),
  }),
  date: z.object({
    position: positionOffsetSchema,
    typography: typographySchema,
  }),
  chinaHolidayName: z.object({
    position: positionOffsetSchema,
    typography: typographySchema,
  }),
  japanHolidayName: z.object({
    position: positionOffsetSchema,
    typography: typographySchema,
  }),
  chinaMarkers: z.object({
    holiday: markerStyleSchema,
    workday: markerStyleSchema,
  }),
  colors: z.object({
    default: z.string(),
    sunday: z.string(),
    saturday: z.string(),
    japanHoliday: z.string(),
  }),
  adjacentMonthOpacity: z.number(),
});

const miniTemplateSchema = z.object({
  width: z.number(),
  height: z.number(),
  monthRow: z.object({
    height: z.number(),
    label: z.object({
      position: positionOffsetSchema,
      typography: typographySchema,
    }),
  }),
  weekdayRow: z.object({
    height: z.number(),
    labels: z.array(z.string()).optional(),
    weekday: z.object({
      position: positionOffsetSchema,
      typography: typographySchema,
    }),
  }),
  date: z.object({
    position: positionOffsetSchema,
    typography: typographySchema,
  }),
  markers: z.object({
    holidayDot: dotMarkerStyleSchema,
    workdayDot: dotMarkerStyleSchema,
  }),
  colors: z.object({
    default: z.string(),
    sunday: z.string(),
    saturday: z.string(),
    japanHoliday: z.string(),
  }),
});

const pageLayoutConfigSchema = z.object({
  width: z.number(),
  height: z.number(),
  padding: z.number(),
  leftColumnRatio: z.number(),
  columnGap: z.number(),
  miniHeightRatio: z.number(),
  miniGap: z.number(),
});

const pagePreviewConfigSchema = z.object({
  layout: pageLayoutConfigSchema,
  backgroundAssetId: z.string().optional(),
});

export const editorDocumentSchema = z.object({
  mainTemplate: mainTemplateSchema,
  miniTemplate: miniTemplateSchema,
  fontCatalog: fontCatalogSchema,
  pagePreview: pagePreviewConfigSchema,
});

import type { EditorDocument } from "../../editor/model/types";
import type { HolidayDataset } from "../../domain/holiday/types";

export type ProjectSnapshotV1 = Readonly<{
  version: 1;
  type: "project";
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  targetYear: number;
  chinaHolidayDataset: HolidayDataset | null;
  japanHolidayDataset: HolidayDataset | null;
  document: EditorDocument;
}>;

export const projectSnapshotV1Schema: z.ZodType<ProjectSnapshotV1> = z.object({
  version: z.literal(1),
  type: z.literal("project"),
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  targetYear: z.number(),
  chinaHolidayDataset: (holidayDatasetSchema as unknown as z.ZodType<HolidayDataset>).nullable(),
  japanHolidayDataset: (holidayDatasetSchema as unknown as z.ZodType<HolidayDataset>).nullable(),
  document: editorDocumentSchema as unknown as z.ZodType<EditorDocument>,
});
