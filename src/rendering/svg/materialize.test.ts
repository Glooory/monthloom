import { describe, expect, it } from "vitest";
import type { RenderScene, SceneTextNode } from "../scene/types";
import { materializeSvg } from "./materialize";
import type { ResolvedFontFace } from "../../resources/fonts/fontkitEngine";
import { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";
import type { AssetResolver, BinaryAsset } from "../../resources/assets/types";
import type { SvgImageNode, SvgPathNode, SvgTextNode } from "./ast";

function createMockFontEngine(): ResolvedFontEngine {
  const face: ResolvedFontFace = {
    fontId: "font-1",
    descriptor: {
      family: "Noto Sans",
      weight: 400,
      style: "normal",
      source: { type: "google", family: "Noto Sans" },
    },
    unitsPerEm: 1000,
    ascent: 800,
    descent: -200,
    internalFont: {
      unitsPerEm: 1000,
      ascent: 800,
      descent: -200,
      layout(text: string) {
        return {
          advanceWidth: text.length * 500,
          glyphs: Array.from(text).map((_, i) => ({
            id: i + 1,
            advanceWidth: 500,
            path: { toSVG: () => `M0 0 L500 0` },
          })),
          positions: Array.from(text).map(() => ({
            xAdvance: 500,
            yAdvance: 0,
            xOffset: 0,
            yOffset: 0,
          })),
        };
      },
    },
  };

  return new ResolvedFontEngine(new Map([["font-1", face]]));
}

const mockAssetResolver: AssetResolver = {
  async resolve(assetId: string): Promise<BinaryAsset> {
    if (assetId === "badge-icon") {
      return {
        bytes: new Uint8Array([137, 80, 78, 71]).buffer,
        mimeType: "image/png",
      };
    }
    throw new Error(`Asset not found: ${assetId}`);
  },
};

describe("Production SVG Materializer", () => {
  it("materializes non-text scene nodes accurately without modifying geometry", async () => {
    const scene: RenderScene = {
      width: 700,
      height: 500,
      nodes: [
        {
          kind: "rect",
          semanticId: "main.grid",
          x: 0.5,
          y: 50.5,
          width: 699,
          height: 449,
          stroke: "#cccccc",
          strokeWidth: 1,
          fill: "none",
        },
        {
          kind: "line",
          semanticId: "main.grid",
          x1: 100.5,
          y1: 50.5,
          x2: 100.5,
          y2: 499.5,
          stroke: "#cccccc",
          strokeWidth: 1,
        },
        {
          kind: "dot",
          semanticId: "mini.holiday.layer-1.holidayMarker",
          cx: 25,
          cy: 35,
          radius: 2,
          color: "#e11d48",
          opacity: 0.9,
        },
        {
          kind: "image",
          semanticId: "main.holiday.layer-1.holidayMarker",
          assetId: "badge-icon",
          x: 10,
          y: 20,
          width: 16,
          height: 16,
          opacity: 0.8,
        },
      ],
    };

    const doc = await materializeSvg({
      scene,
      mode: "outlined",
      fontEngine: createMockFontEngine(),
      assetResolver: mockAssetResolver,
    });

    expect(doc.width).toBe(700);
    expect(doc.height).toBe(500);
    expect(doc.viewBox).toBe("0 0 700 500");
    expect(doc.children).toHaveLength(4);

    // Rect
    const rect = doc.children[0];
    expect(rect).toEqual({
      kind: "rect",
      x: 0.5,
      y: 50.5,
      width: 699,
      height: 449,
      stroke: "#cccccc",
      strokeWidth: 1,
      fill: "none",
    });

    // Line
    const line = doc.children[1];
    expect(line).toEqual({
      kind: "line",
      x1: 100.5,
      y1: 50.5,
      x2: 100.5,
      y2: 499.5,
      stroke: "#cccccc",
      strokeWidth: 1,
    });

    // Circle
    const circle = doc.children[2];
    expect(circle).toEqual({
      kind: "circle",
      cx: 25,
      cy: 35,
      r: 2,
      fill: "#e11d48",
      opacity: 0.9,
    });

    // Image
    const image = doc.children[3] as SvgImageNode;
    expect(image.kind).toBe("image");
    expect(image.x).toBe(10);
    expect(image.y).toBe(20);
    expect(image.width).toBe(16);
    expect(image.height).toBe(16);
    expect(image.href).toBe("data:image/png;base64,iVBORw==");
    expect(image.opacity).toBe(0.8);
  });

  it("materializes text in outlined mode as vector glyph paths", async () => {
    const textNode: SceneTextNode = {
      kind: "text",
      semanticId: "main.date",
      text: "31",
      originX: 114,
      baselineY: 76,
      metrics: { width: 20, ascent: 16, descent: -4 },
      cell: { x: 100, y: 50, width: 50, height: 50 },
      position: { anchor: "center", offsetX: 0, offsetY: 0 },
      typography: {
        fontId: "font-1",
        fontSize: 20,
        fontWeight: 400,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#111111",
        opacity: 0.36,
      },
      color: "#111111",
      opacity: 0.36,
    };

    const scene: RenderScene = {
      width: 500,
      height: 400,
      nodes: [textNode],
    };

    const doc = await materializeSvg({
      scene,
      mode: "outlined",
      fontEngine: createMockFontEngine(),
      assetResolver: mockAssetResolver,
    });

    // Should produce two paths for "31"
    expect(doc.children).toHaveLength(2);
    const path1 = doc.children[0] as SvgPathNode;
    const path2 = doc.children[1] as SvgPathNode;

    expect(path1.kind).toBe("path");
    expect(path1.d).toBe("M0 0 L500 0");
    expect(path1.fill).toBe("#111111");
    expect(path1.opacity).toBe(0.36);
    expect(path1.transform).toBe("translate(114, 76) scale(0.02, -0.02)");

    expect(path2.kind).toBe("path");
    expect(path2.d).toBe("M0 0 L500 0");
    expect(path2.fill).toBe("#111111");
    expect(path2.opacity).toBe(0.36);
    // glyph 2 at 114 + 500 * 0.02 = 124
    expect(path2.transform).toBe("translate(124, 76) scale(0.02, -0.02)");
  });

  it("materializes text in editable mode as SVG <text> elements using resolved coordinates", async () => {
    const textNode: SceneTextNode = {
      kind: "text",
      semanticId: "main.date",
      text: "31",
      originX: 114,
      baselineY: 76,
      metrics: { width: 20, ascent: 16, descent: -4 },
      cell: { x: 100, y: 50, width: 50, height: 50 },
      position: { anchor: "center", offsetX: 0, offsetY: 0 },
      typography: {
        fontId: "font-1",
        fontSize: 20,
        fontWeight: 400,
        fontStyle: "normal",
        letterSpacing: 1.5,
        color: "#111111",
        opacity: 0.6,
      },
      color: "#111111",
      opacity: 0.6,
    };

    const scene: RenderScene = {
      width: 500,
      height: 400,
      nodes: [textNode],
    };

    const doc = await materializeSvg({
      scene,
      mode: "editable",
      fontEngine: createMockFontEngine(),
      assetResolver: mockAssetResolver,
    });

    expect(doc.children).toHaveLength(1);
    const text = doc.children[0] as SvgTextNode;

    expect(text).toEqual({
      kind: "text",
      x: 114,
      y: 76,
      text: "31",
      fontFamily: "Noto Sans",
      fontSize: 20,
      fontWeight: 400,
      fontStyle: "normal",
      letterSpacing: 1.5,
      fill: "#111111",
      opacity: 0.6,
    });
  });
});
