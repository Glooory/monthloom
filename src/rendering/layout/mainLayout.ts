import type { CalendarMonth } from "../../domain/calendar/types";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { ImageMarkerTemplate } from "../../domain/template/primitives";
import type { Rect, RenderNode, RenderScene } from "../scene/types";
import { DEFAULT_MAIN_WEEKDAYS } from "../../domain/template/defaults";
import { applyOffset, getAnchorPoint } from "./anchors";
import { resolveDateColor } from "./colorRules";
import { buildGridBorderNodes, createGridGeometry } from "./geometry";
import { positionText, type TextMeasurer } from "./textMetrics";

function calculateImageMarkerBounds(
  cell: Rect,
  marker: ImageMarkerTemplate,
): { x: number; y: number } {
  const pt = applyOffset(getAnchorPoint(cell, marker.position.anchor), marker.position);
  let x: number;
  let y: number;

  if (marker.position.anchor.endsWith("-left")) {
    x = pt.x;
  } else if (marker.position.anchor.endsWith("-right")) {
    x = pt.x - marker.width;
  } else {
    x = pt.x - marker.width / 2;
  }

  if (marker.position.anchor.startsWith("top-")) {
    y = pt.y;
  } else if (marker.position.anchor.startsWith("bottom-")) {
    y = pt.y - marker.height;
  } else {
    y = pt.y - marker.height / 2;
  }

  return { x, y };
}

export function layoutMain(args: {
  calendar: CalendarMonth;
  template: MainTemplate;
  textMeasurer: TextMeasurer;
  weekdays?: readonly string[];
}): RenderScene {
  const { calendar, template, textMeasurer } = args;
  const weekdays = args.weekdays ?? template.weekdayRow.labels ?? DEFAULT_MAIN_WEEKDAYS;

  const width = template.width;
  const height = template.height;
  const weekdayRowHeight = template.weekdayRow.height;
  const dateGridHeight = height - weekdayRowHeight;

  const nodes: RenderNode[] = [];

  // 1. Weekday row (borderless)
  const weekdayGrid = createGridGeometry({
    x: 0,
    y: 0,
    width,
    height: weekdayRowHeight,
    columns: 7,
    rows: 1,
  });

  for (let c = 0; c < 7; c++) {
    const text = weekdays[c] ?? "";
    const cellRect = weekdayGrid.cells[c];
    const pos = positionText({
      text,
      cell: cellRect,
      position: template.weekdayRow.weekday.position,
      typography: template.weekdayRow.weekday.typography,
      measurer: textMeasurer,
    });
    nodes.push({
      kind: "text",
      semanticId: "main.weekday",
      instanceKey: `main.weekday:${c}`,
      text,
      originX: pos.originX,
      baselineY: pos.baselineY,
      metrics: pos.metrics,
      cell: cellRect,
      position: template.weekdayRow.weekday.position,
      typography: template.weekdayRow.weekday.typography,
      color: template.weekdayRow.weekday.typography.color,
      opacity: template.weekdayRow.weekday.typography.opacity,
    });
  }

  // 2. Date Grid geometry & borders
  const dateGridBounds: Rect = {
    x: 0,
    y: weekdayRowHeight,
    width,
    height: dateGridHeight,
  };

  const dateGrid = createGridGeometry({
    x: dateGridBounds.x,
    y: dateGridBounds.y,
    width: dateGridBounds.width,
    height: dateGridBounds.height,
    columns: 7,
    rows: calendar.weekCount,
  });

  const borderNodes = buildGridBorderNodes({
    bounds: dateGridBounds,
    columns: 7,
    rows: calendar.weekCount,
    strokeWidth: template.dateGrid.borderWidth,
    strokeColor: template.dateGrid.borderColor,
    semanticId: "main.grid",
  });
  nodes.push(...borderNodes);

  // 3. Date Cells
  let cellIndex = 0;
  for (let w = 0; w < calendar.weeks.length; w++) {
    const week = calendar.weeks[w];
    for (let d = 0; d < week.length; d++) {
      const cellData = week[d];
      const cellRect = dateGrid.cells[cellIndex];
      cellIndex++;

      const opacityMultiplier = cellData.inCurrentMonth
        ? 1
        : template.adjacentMonthOpacity;

      const dateKey = `${cellData.date.year}-${String(cellData.date.month).padStart(2, "0")}-${String(cellData.date.day).padStart(2, "0")}`;

      // Date text
      const dateText = String(cellData.date.day);
      const dateColor = resolveDateColor(cellData, template.colors);
      const datePos = positionText({
        text: dateText,
        cell: cellRect,
        position: template.date.position,
        typography: template.date.typography,
        measurer: textMeasurer,
      });
      nodes.push({
        kind: "text",
        semanticId: "main.date",
        instanceKey: `main.date:${dateKey}`,
        text: dateText,
        originX: datePos.originX,
        baselineY: datePos.baselineY,
        metrics: datePos.metrics,
        cell: cellRect,
        position: template.date.position,
        typography: template.date.typography,
        color: dateColor,
        opacity: template.date.typography.opacity * opacityMultiplier,
      });

      // China Holiday / Workday Marker
      if (cellData.holiday?.china?.type) {
        const markerType = cellData.holiday.china.type;
        const markerTemplate =
          markerType === "holiday"
            ? template.chinaMarkers.holiday
            : template.chinaMarkers.workday;

        const semanticId =
          markerType === "holiday"
            ? "main.chinaHolidayMarker"
            : "main.chinaWorkdayMarker";

        if (markerTemplate.type === "text") {
          const markerPos = positionText({
            text: markerTemplate.value,
            cell: cellRect,
            position: markerTemplate.position,
            typography: markerTemplate.typography,
            measurer: textMeasurer,
          });
          nodes.push({
            kind: "text",
            semanticId,
            instanceKey: `${semanticId}:${dateKey}`,
            text: markerTemplate.value,
            originX: markerPos.originX,
            baselineY: markerPos.baselineY,
            metrics: markerPos.metrics,
            cell: cellRect,
            position: markerTemplate.position,
            typography: markerTemplate.typography,
            color: markerTemplate.typography.color,
            opacity: markerTemplate.typography.opacity * opacityMultiplier,
          });
        } else if (markerTemplate.type === "image") {
          const imgBounds = calculateImageMarkerBounds(cellRect, markerTemplate);
          nodes.push({
            kind: "image",
            semanticId,
            instanceKey: `${semanticId}:${dateKey}`,
            assetId: markerTemplate.assetId,
            x: imgBounds.x,
            y: imgBounds.y,
            width: markerTemplate.width,
            height: markerTemplate.height,
            opacity: markerTemplate.opacity * opacityMultiplier,
            cell: cellRect,
            position: markerTemplate.position,
          });
        }
      }

      // China Holiday Name
      if (cellData.holiday?.china?.name) {
        const chinaNameText = cellData.holiday.china.name;
        const chinaNamePos = positionText({
          text: chinaNameText,
          cell: cellRect,
          position: template.chinaHolidayName.position,
          typography: template.chinaHolidayName.typography,
          measurer: textMeasurer,
        });
        nodes.push({
          kind: "text",
          semanticId: "main.chinaHolidayName",
          instanceKey: `main.chinaHolidayName:${dateKey}`,
          text: chinaNameText,
          originX: chinaNamePos.originX,
          baselineY: chinaNamePos.baselineY,
          metrics: chinaNamePos.metrics,
          cell: cellRect,
          position: template.chinaHolidayName.position,
          typography: template.chinaHolidayName.typography,
          color: template.chinaHolidayName.typography.color,
          opacity: template.chinaHolidayName.typography.opacity * opacityMultiplier,
        });
      }

      // Japan Holiday Name
      if (cellData.holiday?.japan?.name) {
        const japanNameText = cellData.holiday.japan.name;
        const japanNamePos = positionText({
          text: japanNameText,
          cell: cellRect,
          position: template.japanHolidayName.position,
          typography: template.japanHolidayName.typography,
          measurer: textMeasurer,
        });
        nodes.push({
          kind: "text",
          semanticId: "main.japanHolidayName",
          instanceKey: `main.japanHolidayName:${dateKey}`,
          text: japanNameText,
          originX: japanNamePos.originX,
          baselineY: japanNamePos.baselineY,
          metrics: japanNamePos.metrics,
          cell: cellRect,
          position: template.japanHolidayName.position,
          typography: template.japanHolidayName.typography,
          color: template.japanHolidayName.typography.color,
          opacity: template.japanHolidayName.typography.opacity * opacityMultiplier,
        });
      }
    }
  }

  return {
    width,
    height,
    nodes,
  };
}

