import { describe, expect, it } from "vitest";
import type { Position, Typography } from "../../domain/template/primitives";
import type { Rect } from "../scene/types";
import { positionText, type TextMeasurer } from "./textMetrics";

describe("Text Metrics and Positioning", () => {
  const fakeMeasurer: TextMeasurer = {
    measure: () => ({
      width: 40,
      ascent: 16,
      descent: -4,
    }),
  };

  const typography: Typography = {
    fontId: "test-font",
    fontSize: 16,
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacing: 0,
    color: "#000000",
    opacity: 1,
  };

  const cell: Rect = { x: 100, y: 50, width: 100, height: 80 };

  it("positions text at top-left with offset", () => {
    const position: Position = {
      anchor: "top-left",
      offsetX: 10,
      offsetY: 8,
    };

    const positioned = positionText({
      text: "15",
      cell,
      position,
      typography,
      measurer: fakeMeasurer,
    });

    expect(positioned.originX).toBe(100 + 10);
    // top of box is at y = 50 + 8 = 58. Since top = baseline - ascent (16), baseline = 58 + 16 = 74
    expect(positioned.baselineY).toBe(50 + 16 + 8);
    expect(positioned.metrics).toEqual({ width: 40, ascent: 16, descent: -4 });
  });

  it("positions text at center with offset", () => {
    const position: Position = {
      anchor: "center",
      offsetX: 5,
      offsetY: -3,
    };

    const positioned = positionText({
      text: "15",
      cell,
      position,
      typography,
      measurer: fakeMeasurer,
    });

    // cell center X = 150. originX = 150 - 40/2 + 5 = 135
    expect(positioned.originX).toBe(135);
    // cell center Y = 90. center Y of box = baseline - (16 + (-4))/2 = baseline - 6. baseline = (90 - 3) + 6 = 93
    expect(positioned.baselineY).toBe(93);
  });

  it("positions text at bottom-right with offset", () => {
    const position: Position = {
      anchor: "bottom-right",
      offsetX: -10,
      offsetY: -8,
    };

    const positioned = positionText({
      text: "15",
      cell,
      position,
      typography,
      measurer: fakeMeasurer,
    });

    // cell right = 200. originX = 200 - 40 - 10 = 150
    expect(positioned.originX).toBe(150);
    // cell bottom = 130. bottom = baseline - (-4) = baseline + 4. baseline = (130 - 8) - 4 = 118
    // Equivalently: cell.y + cell.height + descent + offsetY = 50 + 80 + (-4) + (-8) = 118
    expect(positioned.baselineY).toBe(118);
  });
});
