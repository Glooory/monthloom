import { describe, it, expect } from "vitest";
import { createFormalExportCalendarSet } from "./monthSet";
import { renderFormalDocuments } from "./renderFormalDocuments";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import type { AssetResolver } from "../../resources/assets/types";
import { ResolvedFontEngine, type ResolvedFontFace } from "../../resources/fonts/fontkitEngine";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import { createDefaultHolidayLayers } from "../../domain/template/holidayLayer";
import { serializeSvg } from "../../rendering/svg/serializer";

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

describe("renderFormalDocuments", () => {
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

  it("renders exactly 13 Main and 15 Mini SvgDocuments (total 28)", async () => {
    const calendarSet = createFormalExportCalendarSet({ targetYear: 2027 });
    const fontEngine = createMockFontEngine();

    const rendered = await renderFormalDocuments({
      calendarSet,
      mainTemplate: testMainTemplate,
      miniTemplate: testMiniTemplate,
      mode: "outlined",
      fontEngine,
      assetResolver: mockAssetResolver,
    });

    expect(rendered.main.size).toBe(13);
    expect(rendered.mini.size).toBe(15);
    expect(rendered.main.size + rendered.mini.size).toBe(28);

    // Verify presence of boundary documents
    expect(rendered.main.has("2027-1")).toBe(true);
    expect(rendered.main.has("2028-1")).toBe(true);
    expect(rendered.mini.has("2026-12")).toBe(true);
    expect(rendered.mini.has("2028-2")).toBe(true);
  });

  it.each(["outlined", "editable"] as const)(
    "embeds main and mini holiday images for SVG 1.1 and SVG 2 readers in %s mode",
    async (mode) => {
      const baseLayer = createDefaultHolidayLayers()[0];
      const marker = {
        enabled: true,
        marker: {
          type: "image" as const,
          assetId: "holiday-badge",
          position: { anchor: "top-right" as const, offsetX: -2, offsetY: 2 },
          width: 16,
          height: 16,
          opacity: 1,
        },
      };
      const layer = {
        ...baseLayer,
        main: { ...baseLayer.main, showName: false, holidayMarker: marker },
        mini: { ...baseLayer.mini, holidayMarker: marker },
      };
      const calendarSet = createFormalExportCalendarSet({
        targetYear: 2027,
        holidayIndex: new Map([
          ["2027-05-01", {
            occurrences: [{
              layerId: layer.id,
              calendarId: layer.calendarId,
              type: "holiday" as const,
            }],
          }],
        ]),
      });
      const rendered = await renderFormalDocuments({
        calendarSet,
        mainTemplate: testMainTemplate,
        miniTemplate: testMiniTemplate,
        holidayLayers: [layer],
        mode,
        fontEngine: createMockFontEngine(),
        assetResolver: mockAssetResolver,
      });

      for (const documents of [rendered.main, rendered.mini]) {
        const svg = serializeSvg(documents.get("2027-5")!);
        const xml = new DOMParser().parseFromString(svg, "image/svg+xml");
        expect(xml.querySelector("parsererror")).toBeNull();
        const image = xml.querySelector("image");
        expect(image).not.toBeNull();
        expect(image?.getAttribute("href")).toBe("data:image/png;base64,iVBORw==");
        expect(image?.getAttributeNS("http://www.w3.org/1999/xlink", "href"))
          .toBe("data:image/png;base64,iVBORw==");
      }
    },
  );
});
