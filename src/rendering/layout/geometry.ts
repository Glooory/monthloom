import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { ImageMarkerTemplate, MarkerTemplate } from "../../domain/template/primitives";
import type { Rect, RenderNode } from "../scene/types";
import { applyOffset, getAnchorPoint } from "./anchors";
import { positionText, type TextMeasurer } from "./textMetrics";



export function calculateImageMarkerBounds(
  cell: Rect,
  marker: ImageMarkerTemplate,
): { x: number; y: number } {
  const pt = applyOffset(
    getAnchorPoint(cell, marker.position.anchor),
    marker.position,
  );
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

export function buildMarkerRenderNode(args: {
  marker: MarkerTemplate;
  cell: Rect;
  semanticId: string;
  instanceKey: string;
  measurer: TextMeasurer;
  opacityMultiplier?: number;
}): RenderNode | null {

  const {
    marker,
    cell,
    semanticId,
    instanceKey,
    measurer,
    opacityMultiplier = 1,
  } = args;

  if (marker.type === "text") {
    if (!marker.value) return null;
    const markerPos = positionText({
      text: marker.value,
      cell,
      position: marker.position,
      typography: marker.typography,
      measurer,
    });
    return {
      kind: "text",
      semanticId,
      instanceKey,
      text: marker.value,
      originX: markerPos.originX,
      baselineY: markerPos.baselineY,
      metrics: markerPos.metrics,
      cell,
      position: marker.position,
      typography: marker.typography,
      color: marker.typography.color,
      opacity: marker.typography.opacity * opacityMultiplier,
    };
  }

  if (marker.type === "image") {
    const imgBounds = calculateImageMarkerBounds(cell, marker);
    return {
      kind: "image",
      semanticId,
      instanceKey,
      assetId: marker.assetId,
      x: imgBounds.x,
      y: imgBounds.y,
      width: marker.width,
      height: marker.height,
      opacity: marker.opacity * opacityMultiplier,
      cell,
      position: marker.position,
    };
  }

  return null;
}


export type GridGeometry = Readonly<{
  bounds: Rect;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  cells: readonly Rect[];
}>;

export function createGridGeometry(args: {
  x: number;
  y: number;
  width: number;
  height: number;
  columns: number;
  rows: number;
}): GridGeometry {
  const { x, y, width, height, columns, rows } = args;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  const cells: Rect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      cells.push({
        x: x + c * cellWidth,
        y: y + r * cellHeight,
        width: cellWidth,
        height: cellHeight,
      });
    }
  }

  return {
    bounds: { x, y, width, height },
    columns,
    rows,
    cellWidth,
    cellHeight,
    cells,
  };
}

export function buildGridBorderNodes(args: {
  bounds: Rect;
  columns: number;
  rows: number;
  strokeWidth: number;
  strokeColor: string;
  semanticId: "main.grid";
  omitBottomBorder?: boolean;
}): readonly RenderNode[] {
  const {
    bounds,
    columns,
    rows,
    strokeWidth,
    strokeColor,
    semanticId,
    omitBottomBorder = false,
  } = args;
  if (strokeWidth <= 0) {
    return [];
  }

  const nodes: RenderNode[] = [];
  const halfStroke = strokeWidth / 2;

  // 1. Outer boundary (closed rect if not omitting bottom border, or 3 separate lines)
  if (!omitBottomBorder) {
    nodes.push({
      kind: "rect",
      semanticId,
      x: bounds.x + halfStroke,
      y: bounds.y + halfStroke,
      width: bounds.width - strokeWidth,
      height: bounds.height - strokeWidth,
      stroke: strokeColor,
      strokeWidth,
      fill: "none",
    });
  } else {
    // Top border line
    nodes.push({
      kind: "line",
      semanticId,
      x1: bounds.x,
      y1: bounds.y + halfStroke,
      x2: bounds.x + bounds.width,
      y2: bounds.y + halfStroke,
      stroke: strokeColor,
      strokeWidth,
    });
    // Left border line
    nodes.push({
      kind: "line",
      semanticId,
      x1: bounds.x + halfStroke,
      y1: bounds.y,
      x2: bounds.x + halfStroke,
      y2: bounds.y + bounds.height,
      stroke: strokeColor,
      strokeWidth,
    });
    // Right border line
    nodes.push({
      kind: "line",
      semanticId,
      x1: bounds.x + bounds.width - halfStroke,
      y1: bounds.y,
      x2: bounds.x + bounds.width - halfStroke,
      y2: bounds.y + bounds.height,
      stroke: strokeColor,
      strokeWidth,
    });
  }

  const cellWidth = bounds.width / columns;
  const cellHeight = bounds.height / rows;

  // 2. Vertical internal lines (columns - 1)
  for (let c = 1; c < columns; c++) {
    const lineX = bounds.x + c * cellWidth;
    nodes.push({
      kind: "line",
      semanticId,
      x1: lineX,
      y1: bounds.y,
      x2: lineX,
      y2: bounds.y + bounds.height,
      stroke: strokeColor,
      strokeWidth,
    });
  }

  // 3. Horizontal internal lines (rows - 1)
  for (let r = 1; r < rows; r++) {
    const lineY = bounds.y + r * cellHeight;
    nodes.push({
      kind: "line",
      semanticId,
      x1: bounds.x,
      y1: lineY,
      x2: bounds.x + bounds.width,
      y2: lineY,
      stroke: strokeColor,
      strokeWidth,
    });
  }

  return nodes;
}

/** One perimeter surrounds dates and, when bordered, the weekday row. */
export function buildMainGridBorderNodes(args: {
  width: number;
  height: number;
  weekdayRowHeight: number;
  rows: number;
  dateGrid: MainTemplate["dateGrid"];
  weekdayRow: MainTemplate["weekdayRow"];
}): readonly RenderNode[] {
  const { width, height, weekdayRowHeight, rows, dateGrid, weekdayRow } = args;
  const weekdayWidth = weekdayRow.borderWidth ?? 1;
  const weekdayColor = weekdayRow.borderColor ?? "#E5E7EB";
  const hasWeekdayBorder = !!weekdayRow.showBorder && weekdayWidth > 0;
  const outerWidth = dateGrid.outerBorderWidth ?? dateGrid.borderWidth;
  const outerColor = dateGrid.outerBorderColor ?? dateGrid.borderColor;
  if (!(dateGrid.showBorder ?? true) || (outerWidth <= 0 && dateGrid.borderWidth <= 0)) {
    return hasWeekdayBorder ? buildGridBorderNodes({
      bounds: { x: 0, y: 0, width, height: weekdayRowHeight },
      columns: 7, rows: 1, strokeWidth: weekdayWidth,
      strokeColor: weekdayColor, semanticId: "main.grid",
    }) : [];
  }

  const top = hasWeekdayBorder ? 0 : weekdayRowHeight;
  const inset = outerWidth / 2;
  const nodes: RenderNode[] = [];
  const addLine = (x1: number, y1: number, x2: number, y2: number, strokeWidth: number, stroke: string) => {
    if (strokeWidth > 0) nodes.push({
      kind: "line", semanticId: "main.grid", x1, y1, x2, y2, strokeWidth, stroke,
    });
  };
  for (let c = 1; c < 7; c++) {
    const x = c * width / 7;
    addLine(x, weekdayRowHeight + (hasWeekdayBorder ? 0 : inset), x, height - inset, dateGrid.borderWidth, dateGrid.borderColor);
    if (hasWeekdayBorder) addLine(x, inset, x, weekdayRowHeight, weekdayWidth, weekdayColor);
  }
  for (let r = hasWeekdayBorder ? 0 : 1; r < rows; r++) {
    const y = weekdayRowHeight + r * (height - weekdayRowHeight) / rows;
    addLine(inset, y, width - inset, y, dateGrid.borderWidth, dateGrid.borderColor);
  }
  // Paint the frame last so inner lines meet it cleanly, even with different widths.
  if (outerWidth > 0) nodes.push(...buildGridBorderNodes({
    bounds: { x: 0, y: top, width, height: height - top },
    columns: 1, rows: 1, strokeWidth: outerWidth,
    strokeColor: outerColor, semanticId: "main.grid",
  }));
  return nodes;
}
