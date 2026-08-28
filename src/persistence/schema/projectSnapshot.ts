import { z } from "zod";
import type { EditorDocument } from "../../editor/model/types";

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
  fontWeight: z.number(),
  fontStyle: z.enum(["normal", "italic"]),
  letterSpacing: z.number(),
  color: z.string(),
  opacity: z.number(),
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

const textMarkerSchema = z.object({
  type: z.literal("text"),
  value: z.string(),
  position: positionOffsetSchema,
  typography: typographySchema,
});

const imageMarkerSchema = z.object({
  type: z.literal("image"),
  assetId: z.string(),
  position: positionOffsetSchema,
  width: z.number(),
  height: z.number(),
  opacity: z.number(),
});

const markerStyleSchema = z.discriminatedUnion("type", [
  textMarkerSchema,
  imageMarkerSchema,
]);

const weekdayColorsSchema = z.object({
  default: z.string().optional(),
  sunday: z.string().optional(),
  saturday: z.string().optional(),
});

const baseColorsSchema = z.object({
  default: z.string(),
  sunday: z.string(),
  saturday: z.string(),
});

const mainTemplateSchema = z.object({
  width: z.number(),
  height: z.number(),
  weekdayRow: z.object({
    height: z.number(),
    labels: z.array(z.string()).optional(),
    startOfWeek: z.union([z.literal(0), z.literal(1)]).optional(),
    showBorder: z.boolean().optional(),
    borderWidth: z.number().optional(),
    borderColor: z.string().optional(),
    colors: weekdayColorsSchema.optional(),
    weekday: z.object({
      position: positionOffsetSchema,
      typography: typographySchema,
    }),
  }),
  dateGrid: z.object({
    showBorder: z.boolean().optional(),
    borderWidth: z.number(),
    borderColor: z.string(),
  }),
  date: z.object({
    position: positionOffsetSchema,
    typography: typographySchema,
  }),
  colors: baseColorsSchema,
  showAdjacentDays: z.boolean().optional(),
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
    startOfWeek: z.union([z.literal(0), z.literal(1)]).optional(),
    showBorder: z.boolean().optional(),
    borderWidth: z.number().optional(),
    borderColor: z.string().optional(),
    colors: weekdayColorsSchema.optional(),
    weekday: z.object({
      position: positionOffsetSchema,
      typography: typographySchema,
    }),
  }),
  date: z.object({
    position: positionOffsetSchema,
    typography: typographySchema,
  }),
  colors: baseColorsSchema,
});

const holidayDateColorsSchema = z.object({
  enabled: z.boolean(),
  holiday: z.string(),
  workday: z.string(),
});

const enabledMarkerStyleSchema = z.object({
  enabled: z.boolean(),
  marker: markerStyleSchema,
});

const holidayLayerSchema = z.object({
  id: z.string(),
  calendarId: z.string(),
  enabled: z.boolean(),
  main: z.object({
    showName: z.boolean(),
    name: z.object({
      position: positionOffsetSchema,
      typography: typographySchema,
    }),
    holidayMarker: enabledMarkerStyleSchema,
    workdayMarker: enabledMarkerStyleSchema,
    dateColors: holidayDateColorsSchema,
  }),
  mini: z.object({
    holidayMarker: enabledMarkerStyleSchema,
    workdayMarker: enabledMarkerStyleSchema,
    dateColors: holidayDateColorsSchema,
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

export const editorDocumentSchema = z
  .object({
    mainTemplate: mainTemplateSchema,
    miniTemplate: miniTemplateSchema,
    holidayLayers: z.array(holidayLayerSchema),
    fontCatalog: fontCatalogSchema,
    pagePreview: pagePreviewConfigSchema,
  })
  .superRefine((doc, ctx) => {
    const layerIds = new Set<string>();
    const calendarIds = new Set<string>();

    for (let i = 0; i < doc.holidayLayers.length; i++) {
      const layer = doc.holidayLayers[i];
      if (layerIds.has(layer.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate holiday layer ID "${layer.id}"`,
          path: ["holidayLayers", i, "id"],
        });
      }
      layerIds.add(layer.id);

      if (calendarIds.has(layer.calendarId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate calendar binding: calendar ID "${layer.calendarId}" is already bound to another layer`,
          path: ["holidayLayers", i, "calendarId"],
        });
      }
      calendarIds.add(layer.calendarId);
    }
  });


export type ProjectSnapshotV1 = Readonly<{
  version: 1;
  type: "project";
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  targetYear: number;
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
  document: editorDocumentSchema as unknown as z.ZodType<EditorDocument>,
});
