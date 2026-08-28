import type { CalendarMonth } from "../../domain/calendar/types";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { Rect, RenderNode, RenderScene } from "../scene/types";
import { DEFAULT_MINI_WEEKDAYS } from "../../domain/template/defaults";
import { applyOffset, getAnchorPoint } from "./anchors";
import { resolveDateColor } from "./colorRules";
import { createGridGeometry } from "./geometry";
import { positionText, type TextMeasurer } from "./textMetrics";

export function layoutMini(args: {
  calendar: CalendarMonth;
  template: MiniTemplate;
  textMeasurer: TextMeasurer;
  weekdays?: readonly string[];
}): RenderScene {
  const { calendar, template, textMeasurer } = args;
  const weekdays = args.weekdays ?? template.weekdayRow.labels ?? DEFAULT_MINI_WEEKDAYS;

  const width = template.width;
  const height = template.height;
  const monthRowHeight = template.monthRow.height;
  const weekdayRowHeight = template.weekdayRow.height;
  const dateGridHeight = height - monthRowHeight - weekdayRowHeight;
  const dateGridY = monthRowHeight + weekdayRowHeight;

  const nodes: RenderNode[] = [];

  // 1. Month Row (borderless)
  const monthCellRect: Rect = {
    x: 0,
    y: 0,
    width,
    height: monthRowHeight,
  };

  const monthLabelText = `${calendar.year}-${calendar.month}`;
  const monthLabelPos = positionText({
    text: monthLabelText,
    cell: monthCellRect,
    position: template.monthRow.label.position,
    typography: template.monthRow.label.typography,
    measurer: textMeasurer,
  });
  nodes.push({
    kind: "text",
    semanticId: "mini.monthLabel",
    instanceKey: `mini.monthLabel:${calendar.year}-${String(calendar.month).padStart(2, "0")}`,
    text: monthLabelText,
    originX: monthLabelPos.originX,
    baselineY: monthLabelPos.baselineY,
    metrics: monthLabelPos.metrics,
    cell: monthCellRect,
    position: template.monthRow.label.position,
    typography: template.monthRow.label.typography,
    color: template.monthRow.label.typography.color,
    opacity: template.monthRow.label.typography.opacity,
  });

  // 2. Weekday Row (borderless)
  const weekdayGrid = createGridGeometry({
    x: 0,
    y: monthRowHeight,
    width,
    height: weekdayRowHeight,
    columns: 7,
    rows: 1,
  });

  for (let c = 0; c < 7; c++) {
    const text = weekdays[c] ?? "";
    const cellRect = weekdayGrid.cells[c];
    const weekdayPos = positionText({
      text,
      cell: cellRect,
      position: template.weekdayRow.weekday.position,
      typography: template.weekdayRow.weekday.typography,
      measurer: textMeasurer,
    });
    nodes.push({
      kind: "text",
      semanticId: "mini.weekday",
      instanceKey: `mini.weekday:${c}`,
      text,
      originX: weekdayPos.originX,
      baselineY: weekdayPos.baselineY,
      metrics: weekdayPos.metrics,
      cell: cellRect,
      position: template.weekdayRow.weekday.position,
      typography: template.weekdayRow.weekday.typography,
      color: template.weekdayRow.weekday.typography.color,
      opacity: template.weekdayRow.weekday.typography.opacity,
    });
  }

  // 3. Date Grid (borderless)
  const dateGrid = createGridGeometry({
    x: 0,
    y: dateGridY,
    width,
    height: dateGridHeight,
    columns: 7,
    rows: calendar.weekCount,
  });

  let cellIndex = 0;
  for (let w = 0; w < calendar.weeks.length; w++) {
    const week = calendar.weeks[w];
    for (let d = 0; d < week.length; d++) {
      const cellData = week[d];
      const cellRect = dateGrid.cells[cellIndex];
      cellIndex++;

      // Adjacent month cells render nothing in Mini calendar
      if (!cellData.inCurrentMonth) {
        continue;
      }

      const dateKey = `${cellData.date.year}-${String(cellData.date.month).padStart(2, "0")}-${String(cellData.date.day).padStart(2, "0")}`;

      // Current month date
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
        semanticId: "mini.date",
        instanceKey: `mini.date:${dateKey}`,
        text: dateText,
        originX: datePos.originX,
        baselineY: datePos.baselineY,
        metrics: datePos.metrics,
        cell: cellRect,
        position: template.date.position,
        typography: template.date.typography,
        color: dateColor,
        opacity: template.date.typography.opacity,
      });

      // China holiday dot / workday dot
      if (cellData.holiday?.china?.type) {
        const markerType = cellData.holiday.china.type;
        const dotTemplate =
          markerType === "holiday"
            ? template.markers.holidayDot
            : template.markers.workdayDot;

        const semanticId =
          markerType === "holiday" ? "mini.holidayDot" : "mini.workdayDot";

        const dotCenter = applyOffset(
          getAnchorPoint(cellRect, dotTemplate.position.anchor),
          dotTemplate.position,
        );

        nodes.push({
          kind: "dot",
          semanticId,
          instanceKey: `${semanticId}:${dateKey}`,
          cx: dotCenter.x,
          cy: dotCenter.y,
          radius: dotTemplate.size / 2,
          color: dotTemplate.color,
          opacity: dotTemplate.opacity,
          cell: cellRect,
          position: dotTemplate.position,
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

