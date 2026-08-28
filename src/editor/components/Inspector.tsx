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
  "main.date": "主日历日期",
  "main.weekday": "星期标题行",
  "main.chinaHolidayName": "中国节假日名称",
  "main.japanHolidayName": "日本节假日名称",
  "main.chinaHolidayMarker": "中国休假角标",
  "main.chinaWorkdayMarker": "中国班/补班角标",
  "main.grid": "日期网格",
  "mini.monthLabel": "附日历月份标题",
  "mini.weekday": "附日历星期行",
  "mini.date": "附日历日期",
  "mini.holidayDot": "附日历休假圆点",
  "mini.workdayDot": "附日历班期圆点",
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
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>未选中任何元素</div>
          <div style={{ lineHeight: 1.5, maxWidth: "220px" }}>
            点击左侧图层列表或直接点击日历画布中的文字、角标进行编辑。
          </div>
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
        <p className="inspector-subtitle">当前选中：{instanceKey}</p>
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
