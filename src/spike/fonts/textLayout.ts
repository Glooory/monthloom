import type { SpikeFont } from "./fontkitAdapter";
import type { SvgPath } from "../svg/ast";

export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Position = {
  anchor: Anchor;
  offsetX: number;
  offsetY: number;
};

export type PositionedGlyphRun = {
  originX: number;
  baselineY: number;
  width: number;
  ascent: number;
  descent: number;
  paths: SvgPath[];
};

export function fontScale(font: SpikeFont, fontSize: number): number {
  return fontSize / font.unitsPerEm;
}

function getHorizontalBase(
  anchor: Anchor,
  cell: Rect,
  textWidth: number,
): number {
  if (anchor.includes("left")) {
    return cell.x;
  }
  if (anchor.includes("right")) {
    return cell.x + cell.width - textWidth;
  }
  // center
  return cell.x + cell.width / 2 - textWidth / 2;
}

function getVerticalBase(
  anchor: Anchor,
  cell: Rect,
  scaledAscent: number,
  scaledDescent: number,
): number {
  if (anchor.startsWith("top")) {
    return cell.y + scaledAscent;
  }
  if (anchor.startsWith("bottom")) {
    return cell.y + cell.height + scaledDescent;
  }
  // center
  return cell.y + cell.height / 2 + (scaledAscent + scaledDescent) / 2;
}

export function layoutOutlinedText(args: {
  text: string;
  font: SpikeFont;
  fontSize: number;
  cell: Rect;
  position: Position;
  color?: string;
  opacity?: number;
}): PositionedGlyphRun {
  const { text, font, fontSize, cell, position, color = "#000000", opacity } = args;
  const scale = fontScale(font, fontSize);
  const scaledAscent = font.ascent * scale;
  const scaledDescent = font.descent * scale;

  const run = font.layout(text);
  const textWidth = run.advanceWidth * scale;

  const originX = getHorizontalBase(position.anchor, cell, textWidth) + position.offsetX;
  const baselineY =
    getVerticalBase(position.anchor, cell, scaledAscent, scaledDescent) + position.offsetY;

  const paths: SvgPath[] = [];
  let currentFontX = 0;

  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i];
    if (glyph.pathData) {
      const gx = originX + (currentFontX + glyph.xOffset) * scale;
      const gy = baselineY - glyph.yOffset * scale;
      paths.push({
        kind: "path",
        d: glyph.pathData,
        transform: `translate(${gx}, ${gy}) scale(${scale}, ${-scale})`,
        fill: color,
        opacity,
      });
    }
    currentFontX += glyph.xAdvance;
  }

  return {
    originX,
    baselineY,
    width: textWidth,
    ascent: scaledAscent,
    descent: scaledDescent,
    paths,
  };
}
