import { describe, expect, it } from "vitest";
import type { Anchor, Position } from "../../domain/template/primitives";
import type { Rect } from "../scene/types";
import { applyOffset, getAnchorPoint } from "./anchors";

describe("Nine-point Anchor Geometry", () => {
  const rect: Rect = { x: 10, y: 20, width: 100, height: 60 };

  const anchorCases: Array<{ anchor: Anchor; expected: { x: number; y: number } }> = [
    { anchor: "top-left", expected: { x: 10, y: 20 } },
    { anchor: "top-center", expected: { x: 60, y: 20 } },
    { anchor: "top-right", expected: { x: 110, y: 20 } },
    { anchor: "center-left", expected: { x: 10, y: 50 } },
    { anchor: "center", expected: { x: 60, y: 50 } },
    { anchor: "center-right", expected: { x: 110, y: 50 } },
    { anchor: "bottom-left", expected: { x: 10, y: 80 } },
    { anchor: "bottom-center", expected: { x: 60, y: 80 } },
    { anchor: "bottom-right", expected: { x: 110, y: 80 } },
  ];

  it.each(anchorCases)("calculates correct point for $anchor", ({ anchor, expected }) => {
    const point = getAnchorPoint(rect, anchor);
    expect(point).toEqual(expected);
  });

  it("applies offset to anchor point correctly", () => {
    const anchorPoint = getAnchorPoint(rect, "center");
    const position: Position = {
      anchor: "center",
      offsetX: 14,
      offsetY: -8,
    };
    const offsetPoint = applyOffset(anchorPoint, position);
    expect(offsetPoint).toEqual({ x: 74, y: 42 });
  });
});
