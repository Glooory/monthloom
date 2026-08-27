import { describe, expect, it } from "vitest";
import type { FontDescriptor } from "../../domain/template/font";
import type { Typography } from "../../domain/template/primitives";
import {
  ResolvedFontEngine,
  type ResolvedFontFace,
} from "./fontkitEngine";

function createMockFontFace(args: {
  fontId: string;
  family?: string;
  weight?: number;
  style?: "normal" | "italic";
  unitsPerEm?: number;
  ascent?: number;
  descent?: number;
  glyphAdvance?: number;
}): ResolvedFontFace {
  const {
    fontId,
    family = "MockFont",
    weight = 400,
    style = "normal",
    unitsPerEm = 1000,
    ascent = 800,
    descent = -200,
    glyphAdvance = 500,
  } = args;

  const descriptor: FontDescriptor = {
    family,
    weight,
    style,
    source: { type: "google", family },
  };

  const internalFont = {
    unitsPerEm,
    ascent,
    descent,
    layout(text: string) {
      const glyphs = Array.from(text).map((_, i) => ({
        id: i + 1,
        advanceWidth: glyphAdvance,
        path: {
          toSVG: () => `M0 0 L${glyphAdvance} 0`,
        },
      }));
      const positions = glyphs.map(() => ({
        xAdvance: glyphAdvance,
        yAdvance: 0,
        xOffset: 0,
        yOffset: 0,
      }));
      return {
        glyphs,
        positions,
        advanceWidth: glyphs.length * glyphAdvance,
      };
    },
  };

  return {
    fontId,
    descriptor,
    unitsPerEm,
    ascent,
    descent,
    internalFont,
  };
}

describe("ResolvedFontEngine", () => {
  const baseTypography: Typography = {
    fontId: "font-1",
    fontSize: 20,
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacing: 0,
    color: "#000",
    opacity: 1,
  };

  it("scales font metrics correctly during measure", () => {
    const face = createMockFontFace({
      fontId: "font-1",
      unitsPerEm: 1000,
      ascent: 800,
      descent: -200,
      glyphAdvance: 500,
    });

    const engine = new ResolvedFontEngine(new Map([["font-1", face]]));
    const metrics = engine.measure("AB", baseTypography);

    // scale = 20 / 1000 = 0.02
    // ascent = 800 * 0.02 = 16
    // descent = -200 * 0.02 = -4
    // width = (2 * 500) * 0.02 = 20
    expect(metrics.ascent).toBe(16);
    expect(metrics.descent).toBe(-4);
    expect(metrics.width).toBe(20);
  });

  it("applies letterSpacing consistently to both measure and outline", () => {
    const face = createMockFontFace({
      fontId: "font-1",
      unitsPerEm: 1000,
      glyphAdvance: 500,
    });

    const typographyWithSpacing: Typography = {
      ...baseTypography,
      fontSize: 20,
      letterSpacing: 3, // 3px extra spacing between glyphs
    };

    const engine = new ResolvedFontEngine(new Map([["font-1", face]]));
    const metrics = engine.measure("ABC", typographyWithSpacing);

    // 3 glyphs -> 2 gaps * 3px = 6px
    // base width = 3 * 500 * 0.02 = 30px
    // total width = 36px
    expect(metrics.width).toBe(36);

    const paths = engine.outline({
      text: "ABC",
      typography: typographyWithSpacing,
      originX: 100,
      baselineY: 200,
    });

    expect(paths).toHaveLength(3);
    // glyph 0: 100 + 0 = 100
    expect(paths[0].transform).toBe("translate(100, 200) scale(0.02, -0.02)");
    // glyph 1: 100 + (500 * 0.02) + 3 = 113
    expect(paths[1].transform).toBe("translate(113, 200) scale(0.02, -0.02)");
    // glyph 2: 100 + (1000 * 0.02) + 6 = 126
    expect(paths[2].transform).toBe("translate(126, 200) scale(0.02, -0.02)");
  });

  it("throws descriptive error on missing fontId", () => {
    const engine = new ResolvedFontEngine(new Map());
    expect(() => engine.measure("A", baseTypography)).toThrow(
      /Font face not found for fontId: "font-1"/,
    );
  });

  it("throws descriptive error on font weight mismatch", () => {
    const face = createMockFontFace({
      fontId: "font-1",
      weight: 400,
    });

    const engine = new ResolvedFontEngine(new Map([["font-1", face]]));
    const mismatchTypography: Typography = {
      ...baseTypography,
      fontWeight: 700,
    };

    expect(() => engine.measure("A", mismatchTypography)).toThrow(
      /Font weight mismatch for fontId "font-1": requested 700, but registered descriptor is 400/,
    );
  });

  it("throws descriptive error on font style mismatch", () => {
    const face = createMockFontFace({
      fontId: "font-1",
      style: "normal",
    });

    const engine = new ResolvedFontEngine(new Map([["font-1", face]]));
    const mismatchTypography: Typography = {
      ...baseTypography,
      fontStyle: "italic",
    };

    expect(() => engine.measure("A", mismatchTypography)).toThrow(
      /Font style mismatch for fontId "font-1": requested italic, but registered descriptor is normal/,
    );
  });

  it("returns registered FontDescriptor via getDescriptor", () => {
    const face = createMockFontFace({
      fontId: "font-1",
      family: "Noto Sans",
      weight: 400,
      style: "normal",
    });

    const engine = new ResolvedFontEngine(new Map([["font-1", face]]));
    const descriptor = engine.getDescriptor("font-1");
    expect(descriptor.family).toBe("Noto Sans");
    expect(descriptor.weight).toBe(400);
  });
});
