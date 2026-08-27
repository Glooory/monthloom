import * as fontkit from "fontkit";

export type SpikeGlyph = {
  id: number;
  advanceWidth: number;
  xAdvance: number;
  yAdvance: number;
  xOffset: number;
  yOffset: number;
  pathData: string;
};

export type SpikeGlyphRun = {
  glyphs: SpikeGlyph[];
  advanceWidth: number;
};

export type SpikeFont = {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  layout(text: string): SpikeGlyphRun;
};

export function parseFont(bytes: ArrayBuffer): SpikeFont {
  const buffer = new Uint8Array(bytes);
  const parsed = fontkit.create(buffer);
  if (!parsed) {
    throw new Error("Failed to parse font binary with fontkit");
  }

  const font =
    "fonts" in parsed && Array.isArray((parsed as { fonts: fontkit.Font[] }).fonts)
      ? (parsed as { fonts: fontkit.Font[] }).fonts[0]
      : (parsed as fontkit.Font);

  return {
    unitsPerEm: font.unitsPerEm,
    ascent: font.ascent,
    descent: font.descent,
    layout(text: string): SpikeGlyphRun {
      const run = font.layout(text);
      const glyphs: SpikeGlyph[] = run.glyphs.map((g, i) => {
        const pos = run.positions[i] || {
          xAdvance: g.advanceWidth,
          yAdvance: 0,
          xOffset: 0,
          yOffset: 0,
        };
        const pathData = g.path ? g.path.toSVG() : "";
        return {
          id: g.id,
          advanceWidth: g.advanceWidth,
          xAdvance: pos.xAdvance,
          yAdvance: pos.yAdvance,
          xOffset: pos.xOffset,
          yOffset: pos.yOffset,
          pathData,
        };
      });

      const totalAdvance =
        run.advanceWidth ??
        glyphs.reduce((acc: number, g: SpikeGlyph) => acc + g.xAdvance, 0);

      return {
        glyphs,
        advanceWidth: totalAdvance,
      };
    },
  };
}
