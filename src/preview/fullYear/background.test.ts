import { describe, it, expect, vi } from "vitest";
import { resolveBackgroundDataUri } from "./background";
import { MemoryAssetStore } from "../../editor/assets/memoryAssetStore";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import { DEFAULT_MAIN_TEMPLATE } from "../../domain/template/defaults";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import { renderMainSvgDocument } from "../../rendering/svg/renderCalendarSvg";
import { serializeSvg } from "../../rendering/svg/serializer";
import { ResolvedFontEngine, type ResolvedFontFace } from "../../resources/fonts/fontkitEngine";
import * as resolveFontsModule from "../../resources/fonts/resolveFonts";

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
  chinaHolidayName: {
    ...DEFAULT_MAIN_TEMPLATE.chinaHolidayName,
    typography: {
      ...DEFAULT_MAIN_TEMPLATE.chinaHolidayName.typography,
      fontId: "default-sans",
      fontWeight: 400,
    },
  },
  japanHolidayName: {
    ...DEFAULT_MAIN_TEMPLATE.japanHolidayName,
    typography: {
      ...DEFAULT_MAIN_TEMPLATE.japanHolidayName.typography,
      fontId: "default-sans",
      fontWeight: 400,
    },
  },
  chinaMarkers: {
    holiday: {
      type: "text",
      value: "休",
      position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
      typography: {
        fontId: "default-sans",
        fontSize: 10,
        fontWeight: 400,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#DC2626",
        opacity: 1,
      },
    },
    workday: {
      type: "text",
      value: "班",
      position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
      typography: {
        fontId: "default-sans",
        fontSize: 10,
        fontWeight: 400,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#4B5563",
        opacity: 1,
      },
    },
  },
};

describe("resolveBackgroundDataUri", () => {
  it("returns null when no assetId is provided", async () => {
    const store = new MemoryAssetStore();
    const uri = await resolveBackgroundDataUri({
      assetId: undefined,
      assetResolver: store,
    });
    expect(uri).toBeNull();
  });

  it("resolves background asset to data URI when assetId exists", async () => {
    const store = new MemoryAssetStore();
    store.setAsset("bg-1", {
      bytes: new Uint8Array([1, 2, 3, 4]).buffer,
      mimeType: "image/png",
    });

    const uri = await resolveBackgroundDataUri({
      assetId: "bg-1",
      assetResolver: store,
    });

    expect(uri).toMatch(/^data:image\/png;base64,/);
  });

  it("proves Background does not enter Main/Mini SvgDocument", async () => {
    const store = new MemoryAssetStore();
    store.setAsset("bg-1", {
      bytes: new Uint8Array([1, 2, 3, 4]).buffer,
      mimeType: "image/png",
    });

    const mockEngine = createMockFontEngine();
    const resolveSpy = vi.spyOn(resolveFontsModule, "resolveFontEngine").mockResolvedValue(mockEngine);

    const calendar = generateCalendarMonth(2027, 5);
    const mainDoc1 = await renderMainSvgDocument({
      calendar,
      template: testMainTemplate,
      fontCatalog: {},
      assetResolver: store,
      mode: "outlined",
    });
    const svg1 = serializeSvg(mainDoc1);

    // Now resolve a new background asset in the store
    store.setAsset("bg-2", {
      bytes: new Uint8Array([5, 6, 7, 8]).buffer,
      mimeType: "image/jpeg",
    });
    await resolveBackgroundDataUri({ assetId: "bg-2", assetResolver: store });

    const mainDoc2 = await renderMainSvgDocument({
      calendar,
      template: testMainTemplate,
      fontCatalog: {},
      assetResolver: store,
      mode: "outlined",
    });
    const svg2 = serializeSvg(mainDoc2);

    expect(svg1).toBe(svg2);
    resolveSpy.mockRestore();
  });
});
