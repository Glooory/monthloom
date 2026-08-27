declare module "fontkit" {
  export interface Glyph {
    id: number;
    advanceWidth: number;
    path: {
      toSVG(): string;
    };
  }

  export interface GlyphPosition {
    xAdvance: number;
    yAdvance: number;
    xOffset: number;
    yOffset: number;
  }

  export interface GlyphRun {
    glyphs: Glyph[];
    positions: GlyphPosition[];
    advanceWidth: number;
  }

  export interface Font {
    unitsPerEm: number;
    ascent: number;
    descent: number;
    layout(text: string): GlyphRun;
  }

  export interface FontCollection {
    fonts: Font[];
  }

  export function create(buffer: Uint8Array | ArrayBuffer): Font | FontCollection;
  export function open(path: string): Promise<Font | FontCollection>;
  export function openSync(path: string): Font | FontCollection;

  const fontkit: {
    create(buffer: Uint8Array | ArrayBuffer): Font | FontCollection;
    open(path: string): Promise<Font | FontCollection>;
    openSync(path: string): Font | FontCollection;
  };
  export default fontkit;
}
