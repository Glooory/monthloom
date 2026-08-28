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
  updateFontDescriptor,
  getWeekdayRowSettings,
  setWeekdayRowSettings,
} from "../model/templateBindings";
import { PositionInspector } from "./PositionInspector";
import { TypographyInspector } from "./TypographyInspector";
import { ColorInspector } from "./ColorInspector";
import { BorderInspector } from "./BorderInspector";
import { WeekdayInspector } from "./WeekdayInspector";
import { CanvasInspector } from "./CanvasInspector";
import { HolidayLayerInspector } from "./HolidayLayerInspector";
import { parseHolidaySemanticId } from "../model/holidaySemanticId";
import { useI18n } from "../../shared/i18n/i18nStore";

export interface InspectorProps {
  document: EditorDocument;
  selection: EditorSelection | null;
  activeTemplate?: "main" | "mini";
  onCommitDocument: (next: EditorDocument) => void;
  onAnchorChange?: (nextAnchor: Anchor) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  document,
  selection,
  activeTemplate = "main",
  onCommitDocument,
  onAnchorChange,
}) => {
  const { t } = useI18n();

  if (!selection) {
    return (
      <div className="editor-inspector">
        <CanvasInspector
          document={document}
          activeTemplate={activeTemplate}
          onCommitDocument={onCommitDocument}
        />
      </div>
    );
  }

  const { semanticId, instanceKey } = selection;
  const parsedHoliday = parseHolidaySemanticId(semanticId);
  if (parsedHoliday && document.holidayLayers) {
    const layer = document.holidayLayers.find(
      (l) => l.id === parsedHoliday.layerId,
    );
    if (layer) {
      const elementTitle =
        parsedHoliday.element === "name"
          ? t.holidayLayersUI.elements.name
          : parsedHoliday.element === "holidayMarker"
            ? (parsedHoliday.target === "main"
                ? t.holidayLayersUI.elements.holidayMarkerMain
                : t.holidayLayersUI.elements.holidayMarkerMini)
            : parsedHoliday.element === "workdayMarker"
              ? (parsedHoliday.target === "main"
                  ? t.holidayLayersUI.elements.workdayMarkerMain
                  : t.holidayLayersUI.elements.workdayMarkerMini)
              : t.holidayLayersUI.elements.dateColors;

      return (
        <div className="editor-inspector">
          <div className="inspector-header">
            <h3 className="inspector-title">{elementTitle}</h3>
            <p className="inspector-subtitle">
              {t.inspector.currentSelection}
              {instanceKey}
            </p>
          </div>

          <HolidayLayerInspector
            document={document}
            layer={layer}
            element={parsedHoliday.element}
            target={parsedHoliday.target}
            onCommitDocument={onCommitDocument}
            onAnchorChange={onAnchorChange}
          />
        </div>
      );
    }
  }

  const title = (t.inspector.titles as Record<string, string>)[semanticId] ?? semanticId;

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

  const isWeekday = semanticId === "main.weekday" || semanticId === "mini.weekday";
  const weekdayType = semanticId.startsWith("main") ? "main" : "mini";
  const weekdaySettings = isWeekday ? getWeekdayRowSettings(document, weekdayType) : undefined;
  const parsedIndex = isWeekday && instanceKey.includes(":") ? parseInt(instanceKey.split(":")[1], 10) : NaN;
  const selectedWeekdayIndex = Number.isNaN(parsedIndex) ? undefined : parsedIndex;

  const isGrid = semanticId === "main.grid";
  const gridBorder = isGrid ? getGridBorder(document) : null;

  return (
    <div className="editor-inspector">
      <div className="inspector-header">
        <h3 className="inspector-title">{title}</h3>
        <p className="inspector-subtitle">{t.inspector.currentSelection}{instanceKey}</p>
      </div>

      {/* Weekday Row Settings */}
      {isWeekday && weekdaySettings && (
        <WeekdayInspector
          settings={weekdaySettings}
          selectedIndex={selectedWeekdayIndex}
          onChangeSettings={(nextSettings) =>
            onCommitDocument(setWeekdayRowSettings(document, weekdayType, nextSettings))
          }
        />
      )}

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
      {!isDate && !isWeekday && typography && (
        <ColorInspector
          color={typography.color}
          onChangeColor={(color) =>
            onCommitDocument(
              setTypography(document, semanticId, { ...typography, color }),
            )
          }
        />
      )}

      {/* 4. Grid Border */}
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
