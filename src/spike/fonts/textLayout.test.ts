import { describe, expect, it } from "vitest";
import { fontScale } from "./textLayout";
import type { SpikeFont } from "./fontkitAdapter";

describe("font metrics and scaling", () => {
  const fakeFont: SpikeFont = {
    unitsPerEm: 1000,
    ascent: 800,
    descent: -200,
    layout: () => ({
      glyphs: [],
      advanceWidth: 0,
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
});
