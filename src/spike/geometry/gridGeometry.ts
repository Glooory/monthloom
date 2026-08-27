import type { SvgNode } from "../svg/ast";

export type GridGeometryOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  columns: number;
  rows: number;
  strokeWidth: number;
  strokeColor?: string;
};

export function buildGridGeometry(options: GridGeometryOptions): SvgNode[] {
  const {
    x,
    y,
    width,
    height,
    columns,
    rows,
    strokeWidth,
    strokeColor = "#000000",
  } = options;

  const nodes: SvgNode[] = [];

  // Outer border rectangle inset by strokeWidth / 2 so stroke stays within bounds
  nodes.push({
    kind: "rect",
    x: x + strokeWidth / 2,
    y: y + strokeWidth / 2,
    width: width - strokeWidth,
    height: height - strokeWidth,
    fill: "none",
    stroke: strokeColor,
    strokeWidth,
  });

  const cellWidth = width / columns;
  const cellHeight = height / rows;

  // Internal vertical lines (columns - 1)
  for (let c = 1; c < columns; c++) {
    const lx = x + c * cellWidth;
    nodes.push({
      kind: "line",
      x1: lx,
      y1: y,
      x2: lx,
      y2: y + height,
      stroke: strokeColor,
      strokeWidth,
    });
  }

  // Internal horizontal lines (rows - 1)
  for (let r = 1; r < rows; r++) {
    const ly = y + r * cellHeight;
    nodes.push({
      kind: "line",
      x1: x,
      y1: ly,
      x2: x + width,
      y2: ly,
      stroke: strokeColor,
      strokeWidth,
    });
  }

  return nodes;
}
