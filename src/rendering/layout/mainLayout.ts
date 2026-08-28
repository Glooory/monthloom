import type { CalendarMonth } from "../../domain/calendar/types";
import type { DayOfWeek } from "../../domain/date/types";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { HolidayLayer } from "../../domain/template/holidayLayer";
import type { Rect, RenderNode, RenderScene } from "../scene/types";
import { DEFAULT_MAIN_WEEKDAYS } from "../../domain/template/defaults";
import { resolveDateColor, resolveWeekdayColor } from "./colorRules";
import {
  buildGridBorderNodes,
  buildMarkerRenderNode,
  createGridGeometry,
} from "./geometry";


import { positionText, type TextMeasurer } from "./textMetrics";

export function layoutMain(args: {
  calendar: CalendarMonth;
  template: MainTemplate;
  textMeasurer: TextMeasurer;
  weekdays?: readonly string[];
  holidayLayers?: readonly HolidayLayer[];
}): RenderScene {
  const { calendar, template, textMeasurer, holidayLayers } = args;
  const weekdays =
    args.weekdays ?? template.weekdayRow.labels ?? DEFAULT_MAIN_WEEKDAYS;
  const startOfWeek =
    calendar.startOfWeek ?? template.weekdayRow.startOfWeek ?? 0;

  const width = template.width;
  const height = template.height;
  const weekdayRowHeight = template.weekdayRow.height;
  const dateGridHeight = height - weekdayRowHeight;

  const nodes: RenderNode[] = [];

  // 1. Weekday row
  const hasDateGridBorder =
    (template.dateGrid.showBorder ?? true) &&
    template.dateGrid.borderWidth > 0;
  if (
    template.weekdayRow.showBorder &&
    (template.weekdayRow.borderWidth ?? 1) > 0
  ) {
    const weekdayBorderNodes = buildGridBorderNodes({
      bounds: { x: 0, y: 0, width, height: weekdayRowHeight },
      columns: 7,
      rows: 1,
      strokeWidth: template.weekdayRow.borderWidth ?? 1,
      strokeColor: template.weekdayRow.borderColor ?? "#E5E7EB",
      semanticId: "main.grid",
      omitBottomBorder: hasDateGridBorder,
    });
    nodes.push(...weekdayBorderNodes);
  }

  const weekdayGrid = createGridGeometry({
    x: 0,
    y: 0,
    width,
    height: weekdayRowHeight,
    columns: 7,
    rows: 1,
  });

  for (let c = 0; c < 7; c++) {
    const dayOfWeek = (startOfWeek === 1 ? (c + 1) % 7 : c) as DayOfWeek;
    const text = weekdays[dayOfWeek] ?? "";
    const cellRect = weekdayGrid.cells[c];
    const pos = positionText({
      text,
      cell: cellRect,
      position: template.weekdayRow.weekday.position,
      typography: template.weekdayRow.weekday.typography,
      measurer: textMeasurer,
    });
    const color = resolveWeekdayColor(dayOfWeek, {
      default:
        template.weekdayRow.colors?.default ??
        template.weekdayRow.weekday.typography.color,
      sunday: template.weekdayRow.colors?.sunday ?? template.colors.sunday,
      saturday:
        template.weekdayRow.colors?.saturday ?? template.colors.saturday,
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
      color,
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

  if (
    (template.dateGrid.showBorder ?? true) &&
    template.dateGrid.borderWidth > 0
  ) {
    const borderNodes = buildGridBorderNodes({
      bounds: dateGridBounds,
      columns: 7,
      rows: calendar.weekCount,
      strokeWidth: template.dateGrid.borderWidth,
      strokeColor: template.dateGrid.borderColor,
      semanticId: "main.grid",
    });
    nodes.push(...borderNodes);
  }

  // 3. Date Cells
  let cellIndex = 0;
  for (let w = 0; w < calendar.weeks.length; w++) {
    const week = calendar.weeks[w];
    for (let d = 0; d < week.length; d++) {
      const cellData = week[d];
      const cellRect = dateGrid.cells[cellIndex];
      cellIndex++;

      // Skip adjacent month cells when showAdjacentDays is not enabled (default false)
      if (!cellData.inCurrentMonth && !template.showAdjacentDays) {
        continue;
      }

      const opacityMultiplier = cellData.inCurrentMonth
        ? 1
        : template.adjacentMonthOpacity;

      const dateKey = `${cellData.date.year}-${String(cellData.date.month).padStart(2, "0")}-${String(cellData.date.day).padStart(2, "0")}`;

      // Date text
      const dateText = String(cellData.date.day);
      const dateColor = resolveDateColor(cellData, template.colors, "main");
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

      // Dynamic Holiday Layers
      if (cellData.holiday?.occurrences && holidayLayers) {
        for (const occurrence of cellData.holiday.occurrences) {
          const layer = holidayLayers.find((l) => l.id === occurrence.layerId);
          if (!layer || !layer.enabled) continue;

          // 1. Holiday Name
          if (
            occurrence.type === "holiday" &&
            occurrence.name &&
            layer.main.showName
          ) {
            const namePos = positionText({
              text: occurrence.name,
              cell: cellRect,
              position: layer.main.name.position,
              typography: layer.main.name.typography,
              measurer: textMeasurer,
            });
            const semanticId = `main.holiday.${layer.id}.name`;
            nodes.push({
              kind: "text",
              semanticId,
              instanceKey: `${semanticId}:${dateKey}`,
              text: occurrence.name,
              originX: namePos.originX,
              baselineY: namePos.baselineY,
              metrics: namePos.metrics,
              cell: cellRect,
              position: layer.main.name.position,
              typography: layer.main.name.typography,
              color: layer.main.name.typography.color,
              opacity: layer.main.name.typography.opacity * opacityMultiplier,
            });
          }

          // 2. Holiday / Workday Marker
          const markerConfig =
            occurrence.type === "holiday"
              ? layer.main.holidayMarker
              : layer.main.workdayMarker;

          if (markerConfig.enabled) {
            const semanticId =
              occurrence.type === "holiday"
                ? `main.holiday.${layer.id}.holidayMarker`
                : `main.holiday.${layer.id}.workdayMarker`;

            const markerNode = buildMarkerRenderNode({
              marker: markerConfig.marker,
              cell: cellRect,
              semanticId,
              instanceKey: `${semanticId}:${dateKey}`,
              measurer: textMeasurer,
              opacityMultiplier,
            });

            if (markerNode) {
              nodes.push(markerNode);
            }
          }
        }
      }
    }

  }

  return {
    width,
    height,
    nodes,
  };
}
