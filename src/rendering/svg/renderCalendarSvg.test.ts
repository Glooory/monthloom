import { describe, expect, it, vi } from "vitest";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { AssetResolver } from "../../resources/assets/types";
import type { FontCatalog } from "../../resources/fonts/types";
import { renderMainSvgDocument, renderMiniSvgDocument } from "./renderCalendarSvg";
import * as resolveFontsModule from "../../resources/fonts/resolveFonts";
import { ResolvedFontEngine, type ResolvedFontFace } from "../../resources/fonts/fontkitEngine";

function createMockFontEngine(): ResolvedFontEngine {
  const face: ResolvedFontFace = {
    fontId: "default-sans",
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

  return new ResolvedFontEngine(new Map([["default-sans", face]]));
}

describe("renderCalendarSvg Orchestration", () => {
  const fontCatalog: FontCatalog = {
    "default-sans": {
      family: "Noto Sans",
      weight: 400,
      style: "normal",
      source: { type: "google", family: "Noto Sans" },
    },
  };

  const mockAssetResolver: AssetResolver = {
    async resolve() {
      return {
        bytes: new Uint8Array([137, 80, 78, 71]).buffer,
        mimeType: "image/png",
      };
    },
  };

  const testMainTemplate: MainTemplate = {
    ...DEFAULT_MAIN_TEMPLATE,
    weekdayRow: {
      ...DEFAULT_MAIN_TEMPLATE.weekdayRow,
      weekday: {
        ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday,
        typography: {
          ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday.typography,
          fontId: "default-sans",
          fontWeight: 400,
        },
      },
    },
    date: {
      ...DEFAULT_MAIN_TEMPLATE.date,
      typography: {
        ...DEFAULT_MAIN_TEMPLATE.date.typography,
        fontId: "default-sans",
        fontWeight: 400,
      },
    },
  };

  const testMiniTemplate: MiniTemplate = {
    ...DEFAULT_MINI_TEMPLATE,
    monthRow: {
      ...DEFAULT_MINI_TEMPLATE.monthRow,
      label: {
        ...DEFAULT_MINI_TEMPLATE.monthRow.label,
        typography: {
          ...DEFAULT_MINI_TEMPLATE.monthRow.label.typography,
          fontId: "default-sans",
          fontWeight: 400,
        },
      },
    },
    weekdayRow: {
      ...DEFAULT_MINI_TEMPLATE.weekdayRow,
      weekday: {
        ...DEFAULT_MINI_TEMPLATE.weekdayRow.weekday,
        typography: {
          ...DEFAULT_MINI_TEMPLATE.weekdayRow.weekday.typography,
          fontId: "default-sans",
          fontWeight: 400,
        },
      },
    },
    date: {
      ...DEFAULT_MINI_TEMPLATE.date,
      typography: {
        ...DEFAULT_MINI_TEMPLATE.date.typography,
        fontId: "default-sans",
        fontWeight: 400,
      },
    },
  };

  it("orchestrates Main SVG generation through requirements -> font resolution -> layout -> materialize", async () => {
    const calendar = generateCalendarMonth(2027, 5);
    const mockEngine = createMockFontEngine();

    const resolveSpy = vi
      .spyOn(resolveFontsModule, "resolveFontEngine")
      .mockResolvedValue(mockEngine);

    const doc = await renderMainSvgDocument({
      calendar,
      template: testMainTemplate,
      fontCatalog,
      assetResolver: mockAssetResolver,
      mode: "outlined",
    });

    expect(resolveSpy).toHaveBeenCalledTimes(1);
    expect(doc.width).toBe(testMainTemplate.width);
    expect(doc.height).toBe(testMainTemplate.height);
    expect(doc.viewBox).toBe(`0 0 ${testMainTemplate.width} ${testMainTemplate.height}`);
    expect(doc.children.length).toBeGreaterThan(0);

    resolveSpy.mockRestore();
  });

  it("orchestrates Mini SVG generation through requirements -> font resolution -> layout -> materialize", async () => {
    const calendar = generateCalendarMonth(2027, 5);
    const mockEngine = createMockFontEngine();

    const resolveSpy = vi
      .spyOn(resolveFontsModule, "resolveFontEngine")
      .mockResolvedValue(mockEngine);

    const doc = await renderMiniSvgDocument({
      calendar,
      template: testMiniTemplate,
      fontCatalog,
      assetResolver: mockAssetResolver,
      mode: "editable",
    });

    expect(resolveSpy).toHaveBeenCalledTimes(1);
    expect(doc.width).toBe(testMiniTemplate.width);
    expect(doc.height).toBe(testMiniTemplate.height);
    expect(doc.viewBox).toBe(`0 0 ${testMiniTemplate.width} ${testMiniTemplate.height}`);
    expect(doc.children.length).toBeGreaterThan(0);

    resolveSpy.mockRestore();
  });
});
