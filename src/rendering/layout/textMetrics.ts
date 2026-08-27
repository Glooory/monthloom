import type { Anchor, Position, Typography } from "../../domain/template/primitives";
import type { Rect } from "../scene/types";
import { applyOffset, getAnchorPoint } from "./anchors";

export type TextMetrics = Readonly<{
  width: number;
  ascent: number;
  descent: number;
}>;

export interface TextMeasurer {
  measure(text: string, typography: Typography): TextMetrics;
}

export type PositionedText = Readonly<{
  originX: number;
  baselineY: number;
  metrics: TextMetrics;
}>;

function calculateOriginX(targetX: number, anchor: Anchor, width: number): number {
  if (anchor.endsWith("-left")) {
    return targetX;
  }
  if (anchor.endsWith("-right")) {
    return targetX - width;
  }
  return targetX - width / 2;
}

function calculateBaselineY(
  targetY: number,
  anchor: Anchor,
  ascent: number,
  descent: number,
): number {
  if (anchor.startsWith("top-")) {
    return targetY + ascent;
  }
  if (anchor.startsWith("bottom-")) {
    return targetY + descent;
  }
  return targetY + (ascent + descent) / 2;
}

export function positionText(args: {
  text: string;
  cell: Rect;
  position: Position;
  typography: Typography;
  measurer: TextMeasurer;
}): PositionedText {
  const { text, cell, position, typography, measurer } = args;
  const metrics = measurer.measure(text, typography);
  const targetPoint = applyOffset(getAnchorPoint(cell, position.anchor), position);

  const originX = calculateOriginX(targetPoint.x, position.anchor, metrics.width);
  const baselineY = calculateBaselineY(
    targetPoint.y,
    position.anchor,
    metrics.ascent,
    metrics.descent,
  );

  return {
    originX,
    baselineY,
    metrics,
  };
}
