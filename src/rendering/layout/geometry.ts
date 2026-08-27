import type { Rect, RenderNode } from "../scene/types";

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
}): readonly RenderNode[] {
  const { bounds, columns, rows, strokeWidth, strokeColor, semanticId } = args;
  if (strokeWidth <= 0) {
    return [];
  }

  const nodes: RenderNode[] = [];
  const halfStroke = strokeWidth / 2;

  // 1. Inset outer rect
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
