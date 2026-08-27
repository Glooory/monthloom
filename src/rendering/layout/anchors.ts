import type { Anchor, Position } from "../../domain/template/primitives";
import type { Rect } from "../scene/types";

export type Point = Readonly<{
  x: number;
  y: number;
}>;

export function getAnchorPoint(rect: Rect, anchor: Anchor): Point {
  let x: number;
  let y: number;

  if (anchor.endsWith("-left")) {
    x = rect.x;
  } else if (anchor.endsWith("-right")) {
    x = rect.x + rect.width;
  } else {
    // "top-center", "center", "bottom-center"
    x = rect.x + rect.width / 2;
  }

  if (anchor.startsWith("top-")) {
    y = rect.y;
  } else if (anchor.startsWith("bottom-")) {
    y = rect.y + rect.height;
  } else {
    // "center-left", "center", "center-right"
    y = rect.y + rect.height / 2;
  }

  return { x, y };
}

export function applyOffset(point: Point, position: Position): Point {
  return {
    x: point.x + position.offsetX,
    y: point.y + position.offsetY,
  };
}
