import { describe, expect, it } from "vitest";
import { fontScale, layoutOutlinedText } from "./textLayout";
import type { SpikeFont } from "./fontkitAdapter";

describe("textLayout", () => {
  const fakeFont: SpikeFont = {
    unitsPerEm: 1000,
    ascent: 800,
    descent: -200,
    layout: (_text: string) => ({
      glyphs: [
        {
          id: 1,
          advanceWidth: 2000,
          xAdvance: 2000,
          yAdvance: 0,
          xOffset: 0,
          yOffset: 0,
          pathData: "M 0 0 L 100 100 Z",
        },
      ],
      advanceWidth: 2000, // at scale 0.02, width = 40
    }),
  };

  it("scales metrics consistently with font size", () => {
    const scale = fontScale(fakeFont, 20);
    expect(scale).toBe(0.02);

    const scaledAscent = fakeFont.ascent * scale;
    const scaledDescent = fakeFont.descent * scale;

    expect(scaledAscent).toBe(16);
    expect(scaledDescent).toBe(-4);
  });

  it("calculates top-left anchor position correctly", () => {
    const result = layoutOutlinedText({
      text: "test",
      font: fakeFont,
      fontSize: 20,
      cell: { x: 100, y: 50, width: 200, height: 100 },
      position: { anchor: "top-left", offsetX: 14, offsetY: 10 },
    });

    expect(result.originX).toBe(114);
    expect(result.baselineY).toBe(76);
    expect(result.ascent).toBe(16);
    expect(result.descent).toBe(-4);
    expect(result.width).toBe(40);
    expect(result.paths).toHaveLength(1);
    expect(result.paths[0].transform).toBe("translate(114, 76) scale(0.02, -0.02)");
  });

  it("calculates center anchor position correctly", () => {
    const result = layoutOutlinedText({
      text: "test",
      font: fakeFont,
      fontSize: 20,
      cell: { x: 100, y: 50, width: 200, height: 100 },
      position: { anchor: "center", offsetX: 0, offsetY: 0 },
    });

    // cell center X = 200, textWidth = 40 -> originX = 180
    // cell center Y = 100, (16 + -4)/2 = 6 -> baselineY = 106
    expect(result.originX).toBe(180);
    expect(result.baselineY).toBe(106);
  });

  it("calculates bottom-right anchor position correctly", () => {
    const result = layoutOutlinedText({
      text: "test",
      font: fakeFont,
      fontSize: 20,
      cell: { x: 100, y: 50, width: 200, height: 100 },
      position: { anchor: "bottom-right", offsetX: -10, offsetY: -8 },
    });

    // cell right = 300, offsetX = -10, textWidth = 40 -> originX = 300 - 40 - 10 = 250
    // cell bottom = 150, offsetY = -8, descent = -4 -> baselineY = 150 - 8 + (-4) = 138
    expect(result.originX).toBe(250);
    expect(result.baselineY).toBe(138);
  });

  it.each([
    ["top-center", 180, 76],
    ["top-right", 260, 76],
    ["center-left", 114, 106],
    ["center-right", 260, 106],
    ["bottom-left", 114, 146],
    ["bottom-center", 180, 146],
  ] as const)("calculates %s anchor correctly", (anchor, expectedOriginX, expectedBaselineY) => {
    const result = layoutOutlinedText({
      text: "test",
      font: fakeFont,
      fontSize: 20,
      cell: { x: 100, y: 50, width: 200, height: 100 },
      position: {
        anchor,
        offsetX: anchor.includes("left") ? 14 : anchor.includes("right") ? 0 : 0,
        offsetY: anchor.includes("top") ? 10 : anchor.includes("bottom") ? 0 : 0,
      },
    });

    expect(result.originX).toBe(expectedOriginX);
    expect(result.baselineY).toBe(expectedBaselineY);
  });
});
