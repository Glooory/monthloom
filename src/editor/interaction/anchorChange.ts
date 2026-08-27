import type { Rect } from "../../rendering/scene/types";
import type { Anchor, Position } from "../../domain/template/primitives";
import { getAnchorPoint } from "../../rendering/layout/anchors";

export function calculatePositionForAnchorChange(args: {
  cell: Rect;
  visualBounds: Rect;
  nextAnchor: Anchor;
}): Position {
  const { cell, visualBounds, nextAnchor } = args;
  const visualTargetPoint = getAnchorPoint(visualBounds, nextAnchor);
  const cellBasePoint = getAnchorPoint(cell, nextAnchor);

  return {
    anchor: nextAnchor,
    offsetX: Math.round((visualTargetPoint.x - cellBasePoint.x) * 100) / 100,
    offsetY: Math.round((visualTargetPoint.y - cellBasePoint.y) * 100) / 100,
  };
}
