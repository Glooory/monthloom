import { BUILTIN_CHINA_CALENDAR_ID, BUILTIN_JAPAN_CALENDAR_ID } from "../holiday/types";
import type { MarkerTemplate, TextElementTemplate } from "./primitives";

export type EnabledMarkerStyle = Readonly<{
  enabled: boolean;
  marker: MarkerTemplate;
}>;

export type HolidayDateColors = Readonly<{
  enabled: boolean;
  holiday: string;
  workday: string;
}>;

export type HolidayLayerMainStyle = Readonly<{
  showName: boolean;
  name: TextElementTemplate;
  holidayMarker: EnabledMarkerStyle;
  workdayMarker: EnabledMarkerStyle;
  dateColors: HolidayDateColors;
}>;

export type HolidayLayerMiniStyle = Readonly<{
  holidayMarker: EnabledMarkerStyle;
  workdayMarker: EnabledMarkerStyle;
  dateColors: HolidayDateColors;
}>;

export type HolidayLayer = Readonly<{
  id: string;
  calendarId: string;
  enabled: boolean;
  main: HolidayLayerMainStyle;
  mini: HolidayLayerMiniStyle;
}>;

export function createDefaultHolidayLayers(): readonly HolidayLayer[] {
  return [
    {
      id: "builtin-cn-layer",
      calendarId: BUILTIN_CHINA_CALENDAR_ID,
      enabled: true,
      main: {
        showName: true,
        name: {
          position: { anchor: "bottom-left", offsetX: 10, offsetY: -8 },
          typography: {
            fontId: "main.holiday.builtin-cn-layer.name",
            fontSize: 11,
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#DC2626",
            opacity: 1,
          },
        },
        holidayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "休",
            position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
            typography: {
              fontId: "main.holiday.builtin-cn-layer.marker",
              fontSize: 10,
              fontWeight: 500,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "班",
            position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
            typography: {
              fontId: "main.holiday.builtin-cn-layer.marker",
              fontSize: 10,
              fontWeight: 500,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#4B5563",
              opacity: 1,
            },
          },
        },
        dateColors: {
          enabled: false,
          holiday: "#DC2626",
          workday: "#1F2937",
        },
      },
      mini: {
        holidayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "•",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 700,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "•",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 700,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#6B7280",
              opacity: 1,
            },
          },
        },
        dateColors: {
          enabled: false,
          holiday: "#DC2626",
          workday: "#1F2937",
        },
      },
    },
    {
      id: "builtin-jp-layer",
      calendarId: BUILTIN_JAPAN_CALENDAR_ID,
      enabled: true,
      main: {
        showName: true,
        name: {
          position: { anchor: "bottom-right", offsetX: -10, offsetY: -8 },
          typography: {
            fontId: "main.holiday.builtin-jp-layer.name",
            fontSize: 11,
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#DC2626",
            opacity: 1,
          },
        },
        holidayMarker: {
          enabled: false,
          marker: {
            type: "text",
            value: "祝",
            position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
            typography: {
              fontId: "main.holiday.builtin-jp-layer.marker",
              fontSize: 10,
              fontWeight: 500,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: false,
          marker: {
            type: "text",
            value: "",
            position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
            typography: {
              fontId: "main.holiday.builtin-jp-layer.marker",
              fontSize: 10,
              fontWeight: 500,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#4B5563",
              opacity: 1,
            },
          },
        },
        dateColors: {
          enabled: true,
          holiday: "#DC2626",
          workday: "#1F2937",
        },
      },
      mini: {
        holidayMarker: {
          enabled: false,
          marker: {
            type: "text",
            value: "•",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 700,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: false,
          marker: {
            type: "text",
            value: "•",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "default-sans",
              fontSize: 10,
              fontWeight: 700,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#6B7280",
              opacity: 1,
            },
          },
        },
        dateColors: {
          enabled: true,
          holiday: "#DC2626",
          workday: "#1F2937",
        },
      },
    },
  ];
}

export function createDefaultCustomHolidayLayer(
  calendarId: string,
  id: string = `layer-${Date.now()}`,
): HolidayLayer {
  return {
    id,
    calendarId,
    enabled: true,
    main: {
      showName: true,
      name: {
        position: { anchor: "bottom-left", offsetX: 10, offsetY: -8 },
        typography: {
          fontId: `main.holiday.${id}.name`,
          fontSize: 11,
          fontWeight: 400,
          fontStyle: "normal",
          letterSpacing: 0,
          color: "#DC2626",
          opacity: 1,
        },
      },
      holidayMarker: {
        enabled: false,
        marker: {
          type: "text",
          value: "休",
          position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
          typography: {
            fontId: `main.holiday.${id}.holidayMarker`,
            fontSize: 10,
            fontWeight: 500,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#DC2626",
            opacity: 1,
          },
        },
      },
      workdayMarker: {
        enabled: false,
        marker: {
          type: "text",
          value: "班",
          position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
          typography: {
            fontId: `main.holiday.${id}.workdayMarker`,
            fontSize: 10,
            fontWeight: 500,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#4B5563",
            opacity: 1,
          },
        },
      },
      dateColors: {
        enabled: false,
        holiday: "#DC2626",
        workday: "#1F2937",
      },
    },
    mini: {
      holidayMarker: {
        enabled: true,
        marker: {
          type: "text",
          value: "•",
          position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
          typography: {
            fontId: "default-sans",
            fontSize: 10,
            fontWeight: 700,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#DC2626",
            opacity: 1,
          },
        },
      },
      workdayMarker: {
        enabled: true,
        marker: {
          type: "text",
          value: "•",
          position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
          typography: {
            fontId: "default-sans",
            fontSize: 10,
            fontWeight: 700,
            fontStyle: "normal",
            letterSpacing: 0,
            color: "#6B7280",
            opacity: 1,
          },
        },
      },
      dateColors: {
        enabled: false,
        holiday: "#DC2626",
        workday: "#1F2937",
      },
    },
  };
}

export function addHolidayLayer(
  layers: readonly HolidayLayer[],
  layer: HolidayLayer,
): readonly HolidayLayer[] {
  if (layers.some((l) => l.calendarId === layer.calendarId)) {
    throw new Error(
      `Template already has a layer referencing calendar: ${layer.calendarId}`,
    );
  }
  return [...layers, layer];
}

export function updateHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  update: (layer: HolidayLayer) => HolidayLayer,
): readonly HolidayLayer[] {
  return layers.map((l) => (l.id === layerId ? update(l) : l));
}

export function moveHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  direction: -1 | 1,
): readonly HolidayLayer[] {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index === -1) return layers;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= layers.length) return layers;
  const next = [...layers];
  const [removed] = next.splice(index, 1);
  next.splice(targetIndex, 0, removed);
  return next;
}

export function removeHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
): readonly HolidayLayer[] {
  return layers.filter((l) => l.id !== layerId);
}

export function getHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
): HolidayLayer {
  const found = layers.find((l) => l.id === layerId);
  if (!found) throw new Error(`Holiday layer not found: ${layerId}`);
  return found;
}

export function rebindHolidayLayer(
  layers: readonly HolidayLayer[],
  layerId: string,
  newCalendarId: string,
): readonly HolidayLayer[] {
  if (layers.some((l) => l.id !== layerId && l.calendarId === newCalendarId)) {
    throw new Error(
      `Calendar ${newCalendarId} is already referenced by another layer in this template.`,
    );
  }
  return updateHolidayLayer(layers, layerId, (layer) => ({
    ...layer,
    calendarId: newCalendarId,
  }));
}

export function ensureLayerFontDescriptors<
  T extends Record<string, { family: string; weight: number; style: "normal" | "italic"; source: any }>,
>(
  catalog: T,
  layer: HolidayLayer,
  sourceDescriptor?: { family: string; weight: number; style: "normal" | "italic"; source: any },
): T {
  const next = { ...catalog } as T;

  const fontIds: string[] = [];
  if (layer.main.name.typography.fontId) {
    fontIds.push(layer.main.name.typography.fontId);
  }
  if (
    layer.main.holidayMarker.marker.type === "text" &&
    layer.main.holidayMarker.marker.typography.fontId
  ) {
    fontIds.push(layer.main.holidayMarker.marker.typography.fontId);
  }
  if (
    layer.main.workdayMarker.marker.type === "text" &&
    layer.main.workdayMarker.marker.typography.fontId
  ) {
    fontIds.push(layer.main.workdayMarker.marker.typography.fontId);
  }
  if (
    layer.mini.holidayMarker.marker.type === "text" &&
    layer.mini.holidayMarker.marker.typography.fontId
  ) {
    fontIds.push(layer.mini.holidayMarker.marker.typography.fontId);
  }
  if (
    layer.mini.workdayMarker.marker.type === "text" &&
    layer.mini.workdayMarker.marker.typography.fontId
  ) {
    fontIds.push(layer.mini.workdayMarker.marker.typography.fontId);
  }

  const missingIds = fontIds.filter((id) => !next[id]);
  if (missingIds.length > 0) {
    const templateDesc = sourceDescriptor ?? next["default-sans"];
    if (!templateDesc) {
      throw new Error(
        "Cannot ensure layer font descriptors: no valid source font descriptor or 'default-sans' found in catalog.",
      );
    }
    for (const id of missingIds) {
      (next as any)[id] = { ...templateDesc };
    }
  }

  return next;
}

