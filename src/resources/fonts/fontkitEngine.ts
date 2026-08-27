import * as fontkit from "fontkit";
import type { FontDescriptor } from "../../domain/template/font";
import type { Typography } from "../../domain/template/primitives";
import type { TextMeasurer, TextMetrics } from "../../rendering/layout/textMetrics";

export type ResolvedFontFace = Readonly<{
  fontId: string;
  descriptor: FontDescriptor;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  internalFont: unknown;
}>;

export type GlyphPath = Readonly<{
  d: string;
  transform: string;
}>;

type InternalGlyph = {
  id: number;
  advanceWidth: number;
  path?: {
    toSVG(): string;
  };
};

type InternalPosition = {
  xAdvance: number;
  yAdvance: number;
  xOffset: number;
  yOffset: number;
};

type InternalGlyphRun = {
  glyphs: readonly InternalGlyph[];
  positions: readonly InternalPosition[];
  advanceWidth: number;
};

type InternalFontInterface = {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  layout(text: string): InternalGlyphRun;
};

export function parseFontkitFace(args: {
  fontId: string;
  descriptor: FontDescriptor;
  bytes: ArrayBuffer;
}): ResolvedFontFace {
  const { fontId, descriptor, bytes } = args;
  const buffer = new Uint8Array(bytes);
  const parsed = fontkit.create(buffer as unknown as Buffer);

  if (!parsed) {
    throw new Error(`Failed to parse font binary with fontkit for fontId: "${fontId}"`);
  }

  const font =
    "fonts" in parsed && Array.isArray((parsed as { fonts: unknown[] }).fonts)
      ? ((parsed as { fonts: unknown[] }).fonts[0] as InternalFontInterface)
      : (parsed as InternalFontInterface);

  return {
    fontId,
    descriptor,
    unitsPerEm: font.unitsPerEm,
    ascent: font.ascent,
    descent: font.descent,
    internalFont: font,
  };
}

export class ResolvedFontEngine implements TextMeasurer {
  private readonly faces: ReadonlyMap<string, ResolvedFontFace>;

  constructor(faces: ReadonlyMap<string, ResolvedFontFace>) {
    this.faces = faces;
  }

  private getFace(fontId: string, typography?: Typography): ResolvedFontFace {
    const face = this.faces.get(fontId);
    if (!face) {
      throw new Error(`Font face not found for fontId: "${fontId}"`);
    }

    if (typography) {
      if (typography.fontWeight !== face.descriptor.weight) {
        throw new Error(
          `Font weight mismatch for fontId "${fontId}": requested ${typography.fontWeight}, but registered descriptor is ${face.descriptor.weight}`,
        );
      }
      if (typography.fontStyle !== face.descriptor.style) {
        throw new Error(
          `Font style mismatch for fontId "${fontId}": requested ${typography.fontStyle}, but registered descriptor is ${face.descriptor.style}`,
        );
      }
    }

    return face;
  }

  getDescriptor(fontId: string): FontDescriptor {
    return this.getFace(fontId).descriptor;
  }

  measure(text: string, typography: Typography): TextMetrics {
    if (!text) {
      return { width: 0, ascent: 0, descent: 0 };
    }

    const face = this.getFace(typography.fontId, typography);
    const font = face.internalFont as InternalFontInterface;
    const scale = typography.fontSize / face.unitsPerEm;
    const scaledAscent = face.ascent * scale;
    const scaledDescent = face.descent * scale;

    const run = font.layout(text);
    const glyphCount = run.glyphs.length;
    const shapedAdvance = run.advanceWidth * scale;
    const spacing = Math.max(0, glyphCount - 1) * typography.letterSpacing;
    const width = shapedAdvance + spacing;

    return {
      width,
      ascent: scaledAscent,
      descent: scaledDescent,
    };
  }

  outline(args: {
    text: string;
    typography: Typography;
    originX: number;
    baselineY: number;
  }): readonly GlyphPath[] {
    const { text, typography, originX, baselineY } = args;
    if (!text) {
      return [];
    }

    const face = this.getFace(typography.fontId, typography);
    const font = face.internalFont as InternalFontInterface;
    const scale = typography.fontSize / face.unitsPerEm;

    const run = font.layout(text);
    const paths: GlyphPath[] = [];
    let currentAdvanceX = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i] || {
        xAdvance: glyph.advanceWidth,
        yAdvance: 0,
        xOffset: 0,
        yOffset: 0,
      };

      const pathData = glyph.path ? glyph.path.toSVG() : "";
      if (pathData) {
        const gx = originX + (currentAdvanceX + pos.xOffset) * scale + i * typography.letterSpacing;
        const gy = baselineY - pos.yOffset * scale;
        paths.push({
          d: pathData,
          transform: `translate(${gx}, ${gy}) scale(${scale}, ${-scale})`,
        });
      }

      currentAdvanceX += pos.xAdvance;
    }

    return paths;
  }
}
