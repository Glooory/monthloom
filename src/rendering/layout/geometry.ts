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
