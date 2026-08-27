import { describe, it, expect } from "vitest";
import { calculatePositionForAnchorChange } from "./anchorChange";

describe("anchorChange", () => {
  it("calculates new offset to keep visual bounds stationary when changing anchor", () => {
    const cell = { x: 0, y: 0, width: 100, height: 100 };
    const visualBounds = { x: 10, y: 20, width: 20, height: 10 };

    const newPos = calculatePositionForAnchorChange({
      cell,
      visualBounds,
      nextAnchor: "center",
    });

    expect(newPos.anchor).toBe("center");
    // Visual center is (20, 25), Cell center is (50, 50). Offset is (20-50, 25-50) = (-30, -25)
    expect(newPos.offsetX).toBe(-30);
    expect(newPos.offsetY).toBe(-25);
  });

  it("calculates top-right anchor offset preserving visual bounds", () => {
    const cell = { x: 50, y: 50, width: 100, height: 80 };
    const visualBounds = { x: 110, y: 58, width: 30, height: 14 };

    const newPos = calculatePositionForAnchorChange({
      cell,
      visualBounds,
      nextAnchor: "top-right",
    });

    expect(newPos.anchor).toBe("top-right");
    // Visual top-right is (140, 58). Cell top-right is (150, 50). Offset is (140-150, 58-50) = (-10, 8)
    expect(newPos.offsetX).toBe(-10);
    expect(newPos.offsetY).toBe(8);
  });
});
