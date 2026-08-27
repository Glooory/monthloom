import React from "react";
import type { EditorDocument, EditorSelection, PositionableSemanticId } from "../model/types";
import type { Anchor } from "../../domain/template/primitives";
import {
  getElementPosition,
  setElementPosition,
  getTypography,
  setTypography,
  getCalendarColors,
  setCalendarColors,
  getGridBorder,
  setGridBorder,
  getMarkerDetails,
  setMarkerDetails,
  getDotDetails,
  setDotDetails,
  updateFontDescriptor,
} from "../model/templateBindings";
import { PositionInspector } from "./PositionInspector";
import { TypographyInspector } from "./TypographyInspector";
import { ColorInspector } from "./ColorInspector";
import { BorderInspector } from "./BorderInspector";
import { MarkerInspector } from "./MarkerInspector";
import { DotInspector } from "./DotInspector";

export interface InspectorProps {
  document: EditorDocument;
  selection: EditorSelection | null;
  onCommitDocument: (next: EditorDocument) => void;
  onAnchorChange?: (nextAnchor: Anchor) => void;
}

const SEMANTIC_TITLES: Record<string, string> = {
  "main.date": "Date Template",
  "main.weekday": "Weekday Row",
  "main.chinaHolidayName": "China Holiday Name",
  "main.japanHolidayName": "Japan Holiday Name",
  "main.chinaHolidayMarker": "China Holiday Marker",
  "main.chinaWorkdayMarker": "China Workday Marker",
  "main.grid": "Main Date Grid",
  "mini.monthLabel": "Mini Month Label",
  "mini.weekday": "Mini Weekday Row",
  "mini.date": "Mini Date Template",
  "mini.holidayDot": "Mini Holiday Dot",
  "mini.workdayDot": "Mini Workday Dot",
};

export const Inspector: React.FC<InspectorProps> = ({
  document,
  selection,
  onCommitDocument,
  onAnchorChange,
}) => {
  if (!selection) {
    return (
      <div className="editor-inspector">
        <div className="inspector-empty">
          Click any element on the calendar to inspect and edit its template properties.
        </div>
      </div>
    );
  }

  const { semanticId, instanceKey } = selection;
  const title = SEMANTIC_TITLES[semanticId] ?? semanticId;

  const isPositionable = semanticId !== "main.grid";
  const position = isPositionable
    ? getElementPosition(document, semanticId as PositionableSemanticId)
    : null;

  const typography = getTypography(document, semanticId);
  const fontDescriptor = typography
    ? document.fontCatalog[typography.fontId]
    : undefined;

  const isDate = semanticId === "main.date" || semanticId === "mini.date";
  const calendarColors = isDate
    ? getCalendarColors(document, semanticId.startsWith("main") ? "main" : "mini")
    : undefined;

  const isMarker =
    semanticId === "main.chinaHolidayMarker" || semanticId === "main.chinaWorkdayMarker";
  const marker = isMarker ? getMarkerDetails(document, semanticId) : null;
  const markerFontDescriptor =
    marker && marker.type === "text"
      ? document.fontCatalog[marker.typography.fontId]
      : undefined;

  const isDot =
    semanticId === "mini.holidayDot" || semanticId === "mini.workdayDot";
  const dot = isDot ? getDotDetails(document, semanticId) : null;

  const isGrid = semanticId === "main.grid";
  const gridBorder = isGrid ? getGridBorder(document) : null;

  return (
    <div className="editor-inspector">
      <div className="inspector-header">
        <h3 className="inspector-title">{title}</h3>
        <p className="inspector-subtitle">Selected instance: {instanceKey}</p>
      </div>

      {/* 1. Position */}
      {position && (
        <PositionInspector
          position={position}
          onChange={(nextPos) =>
            onCommitDocument(
              setElementPosition(document, semanticId as PositionableSemanticId, nextPos),
            )
          }
          onAnchorChange={onAnchorChange}
        />
      )}

      {/* 2. Typography */}
      {typography && (
        <TypographyInspector
          typography={typography}
          fontDescriptor={fontDescriptor}
          onChangeTypography={(nextTypo) =>
            onCommitDocument(setTypography(document, semanticId, nextTypo))
          }
          onChangeFontDescriptor={(nextDesc) =>
            onCommitDocument(
              updateFontDescriptor(document, typography.fontId, () => nextDesc),
            )
          }
        />
      )}

      {/* 3. Color */}
      {isDate && calendarColors && (
        <ColorInspector
          isDateElement
          calendarColors={calendarColors}
          onChangeCalendarColors={(nextColors) =>
            onCommitDocument(
              setCalendarColors(
                document,
                semanticId.startsWith("main") ? "main" : "mini",
                nextColors,
              ),
            )
          }
        />
      )}
      {!isDate && typography && (
        <ColorInspector
          color={typography.color}
          onChangeColor={(color) =>
            onCommitDocument(
              setTypography(document, semanticId, { ...typography, color }),
            )
          }
        />
      )}

      {/* 4. Marker */}
      {marker && (
        <MarkerInspector
          marker={marker}
          fontDescriptor={markerFontDescriptor}
          onChangeMarker={(nextMarker) =>
            onCommitDocument(
              setMarkerDetails(
                document,
                semanticId as "main.chinaHolidayMarker" | "main.chinaWorkdayMarker",
                nextMarker,
              ),
            )
          }
          onChangeFontDescriptor={(nextDesc) => {
            if (marker.type === "text") {
              onCommitDocument(
                updateFontDescriptor(
                  document,
                  marker.typography.fontId,
                  () => nextDesc,
                ),
              );
            }
          }}
        />
      )}

      {/* 5. Dot */}
      {dot && (
        <DotInspector
          dot={dot}
          onChangeDot={(nextDot) =>
            onCommitDocument(
              setDotDetails(
                document,
                semanticId as "mini.holidayDot" | "mini.workdayDot",
                nextDot,
              ),
            )
          }
        />
      )}

      {/* 6. Grid Border */}
      {gridBorder && (
        <BorderInspector
          borderWidth={gridBorder.borderWidth}
          borderColor={gridBorder.borderColor}
          onChangeBorder={(nextBorder) =>
            onCommitDocument(setGridBorder(document, nextBorder))
          }
        />
      )}
    </div>
  );
};
