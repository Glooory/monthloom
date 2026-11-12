import React from "react";
import type { Anchor } from "../../domain/template/primitives";
import type { HolidayLayer } from "../../domain/template/holidayLayer";
import { updateHolidayLayer } from "../../domain/template/holidayLayer";
import type { HolidayLayerElement } from "../model/holidaySemanticId";
import type { EditorDocument } from "../model/types";
import type { BinaryAssetWriter } from "../../resources/assets/types";
import { selectElementFont } from "../model/templateBindings";
import { buildHolidaySemanticId } from "../model/holidaySemanticId";
import { useI18n } from "../../shared/i18n/i18nStore";
import { PositionInspector } from "./PositionInspector";
import { TypographyInspector } from "./TypographyInspector";
import { MarkerInspector } from "./MarkerInspector";
import { HolidayDateColorInspector } from "./HolidayDateColorInspector";

export type HolidayLayerInspectorProps = {
  document: EditorDocument;
  layer: HolidayLayer;
  element: HolidayLayerElement;
  target: "main" | "mini";
  onCommitDocument: (next: EditorDocument) => void;
  getCurrentDocument: () => EditorDocument;
  onAnchorChange?: (nextAnchor: Anchor) => void;
  fontAssetStore?: BinaryAssetWriter;
};

export const HolidayLayerInspector: React.FC<HolidayLayerInspectorProps> = ({
  document,
  layer,
  element,
  target,
  onCommitDocument,
  getCurrentDocument,
  onAnchorChange,
  fontAssetStore,
}) => {
  const { t } = useI18n();

  const updateLayer = (updater: (prev: HolidayLayer) => HolidayLayer) => {
    const layers = document.holidayLayers ?? [];
    const nextLayers = updateHolidayLayer(layers, layer.id, updater);
    onCommitDocument({ ...document, holidayLayers: nextLayers });
  };

  if (element === "name" && target === "main") {
    const fontDescriptor =
      document.fontCatalog[layer.main.name.typography.fontId];

    return (
      <>
        <div
          className="inspector-section"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            {t.holidayLayersUI.inspector.showNameLabel}
          </span>
          <input
            type="checkbox"
            checked={layer.main.showName}
            onChange={(e) =>
              updateLayer((l) => ({
                ...l,
                main: { ...l.main, showName: e.target.checked },
              }))
            }
          />
        </div>

        {layer.main.showName && (
          <>
            <PositionInspector
              position={layer.main.name.position}
              onChange={(nextPos) =>
                updateLayer((l) => ({
                  ...l,
                  main: {
                    ...l.main,
                    name: { ...l.main.name, position: nextPos },
                  },
                }))
              }
              onAnchorChange={onAnchorChange}
            />
            <TypographyInspector
              typography={layer.main.name.typography}
              fontDescriptor={fontDescriptor}
              fontAssetStore={fontAssetStore}
              onSelectFont={(descriptor, typography) =>
                onCommitDocument(selectElementFont(
                  getCurrentDocument(), buildHolidaySemanticId("main", layer.id, "name"), descriptor, typography,
                ))
              }
              onChangeTypography={(nextTypo) =>
                updateLayer((l) => ({
                  ...l,
                  main: {
                    ...l.main,
                    name: { ...l.main.name, typography: nextTypo },
                  },
                }))
              }
            />
          </>
        )}
      </>
    );
  }

  if (element === "holidayMarker") {
    const enabled =
      target === "main"
        ? layer.main.holidayMarker.enabled
        : layer.mini.holidayMarker.enabled;
    const marker =
      target === "main"
        ? layer.main.holidayMarker.marker
        : layer.mini.holidayMarker.marker;
    const markerFontDescriptor =
      marker.type === "text"
        ? document.fontCatalog[marker.typography.fontId]
        : undefined;

    return (
      <>
        <div
          className="inspector-section"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            {target === "main"
              ? t.holidayLayersUI.inspector.enableHolidayMarkerMain
              : t.holidayLayersUI.inspector.enableHolidayMarkerMini}
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) =>
              updateLayer((l) => ({
                ...l,
                ...(target === "main"
                  ? {
                      main: {
                        ...l.main,
                        holidayMarker: {
                          ...l.main.holidayMarker,
                          enabled: e.target.checked,
                        },
                      },
                    }
                  : {
                      mini: {
                        ...l.mini,
                        holidayMarker: {
                          ...l.mini.holidayMarker,
                          enabled: e.target.checked,
                        },
                      },
                    }),
              }))
            }
          />
        </div>

        {enabled && (
          <MarkerInspector
            key={`${target}.${layer.id}.${element}`}
            marker={marker}
            onAnchorChange={onAnchorChange}
            defaultTextFontDescriptor={document.fontCatalog[layer.main.name.typography.fontId]}
            defaultTextFontId={layer.main.name.typography.fontId}
            fontDescriptor={markerFontDescriptor}
            fontAssetStore={fontAssetStore}
            onSelectFont={(descriptor, typography) =>
              onCommitDocument(selectElementFont(
                getCurrentDocument(), buildHolidaySemanticId(target, layer.id, "holidayMarker"), descriptor, typography,
              ))
            }
            onChangeMarker={(nextMarker) =>
              updateLayer((l) => ({
                ...l,
                ...(target === "main"
                  ? {
                      main: {
                        ...l.main,
                        holidayMarker: {
                          ...l.main.holidayMarker,
                          marker: nextMarker,
                        },
                      },
                    }
                  : {
                      mini: {
                        ...l.mini,
                        holidayMarker: {
                          ...l.mini.holidayMarker,
                          marker: nextMarker,
                        },
                      },
                    }),
              }))
            }
          />
        )}
      </>
    );
  }

  if (element === "workdayMarker") {
    const enabled =
      target === "main"
        ? layer.main.workdayMarker.enabled
        : layer.mini.workdayMarker.enabled;
    const marker =
      target === "main"
        ? layer.main.workdayMarker.marker
        : layer.mini.workdayMarker.marker;
    const markerFontDescriptor =
      marker.type === "text"
        ? document.fontCatalog[marker.typography.fontId]
        : undefined;

    return (
      <>
        <div
          className="inspector-section"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            {target === "main"
              ? t.holidayLayersUI.inspector.enableWorkdayMarkerMain
              : t.holidayLayersUI.inspector.enableWorkdayMarkerMini}
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) =>
              updateLayer((l) => ({
                ...l,
                ...(target === "main"
                  ? {
                      main: {
                        ...l.main,
                        workdayMarker: {
                          ...l.main.workdayMarker,
                          enabled: e.target.checked,
                        },
                      },
                    }
                  : {
                      mini: {
                        ...l.mini,
                        workdayMarker: {
                          ...l.mini.workdayMarker,
                          enabled: e.target.checked,
                        },
                      },
                    }),
              }))
            }
          />
        </div>

        {enabled && (
          <MarkerInspector
            key={`${target}.${layer.id}.${element}`}
            marker={marker}
            onAnchorChange={onAnchorChange}
            defaultTextFontDescriptor={document.fontCatalog[layer.main.name.typography.fontId]}
            defaultTextFontId={layer.main.name.typography.fontId}
            fontDescriptor={markerFontDescriptor}
            fontAssetStore={fontAssetStore}
            onSelectFont={(descriptor, typography) =>
              onCommitDocument(selectElementFont(
                getCurrentDocument(), buildHolidaySemanticId(target, layer.id, "workdayMarker"), descriptor, typography,
              ))
            }
            onChangeMarker={(nextMarker) =>
              updateLayer((l) => ({
                ...l,
                ...(target === "main"
                  ? {
                      main: {
                        ...l.main,
                        workdayMarker: {
                          ...l.main.workdayMarker,
                          marker: nextMarker,
                        },
                      },
                    }
                  : {
                      mini: {
                        ...l.mini,
                        workdayMarker: {
                          ...l.mini.workdayMarker,
                          marker: nextMarker,
                        },
                      },
                    }),
              }))
            }
          />
        )}
      </>
    );
  }

  if (element === "dateColors") {
    const dateColors =
      target === "main" ? layer.main.dateColors : layer.mini.dateColors;

    return (
      <HolidayDateColorInspector
        dateColors={dateColors}
        onChange={(nextColors) =>
          updateLayer((l) => ({
            ...l,
            ...(target === "main"
              ? { main: { ...l.main, dateColors: nextColors } }
              : { mini: { ...l.mini, dateColors: nextColors } }),
          }))
        }
      />
    );
  }

  return null;
};
