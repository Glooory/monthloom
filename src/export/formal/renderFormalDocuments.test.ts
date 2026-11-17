import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { createFormalExportCalendarSet } from "./monthSet";
import { renderFormalDocuments } from "./renderFormalDocuments";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import type { AssetResolver } from "../../resources/assets/types";
import { ResolvedFontEngine, parseFontkitFace, type ResolvedFontFace } from "../../resources/fonts/fontkitEngine";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import { createDefaultHolidayLayers } from "../../domain/template/holidayLayer";
import { serializeSvg } from "../../rendering/svg/serializer";
import { composeFullPageDocuments } from "./composeFullPageDocuments";
import holidaySvg from "../../rendering/svg/fixtures/holiday-mini.svg?raw";
import workdaySvg from "../../rendering/svg/fixtures/workday-mini.svg?raw";
import { binaryAssetToDataUri } from "../../resources/assets/dataUri";
import { collectFormalExportFontRequirements } from "./fontRequirements";
import { DEFAULT_PAGE_PREVIEW_CONFIG } from "../../domain/pagePreview/defaults";

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

  it.each(["outlined", "editable"] as const)("exports Chinese text badges in %s mode", async (mode) => {
    const fontEngine = new ResolvedFontEngine(new Map([["default-sans", parseFontkitFace({
      fontId: "default-sans",
      descriptor: { family: "Noto Sans SC", weight: 400, style: "normal", source: { type: "google", family: "Noto Sans SC" } },
      bytes: Uint8Array.from(readFileSync("src/resources/fonts/bundled/NotoSansSC-Regular.otf")).buffer,
    })]]));
    const typography = { fontId: "default-sans", fontSize: 16, fontWeight: 400,
      fontStyle: "normal" as const, letterSpacing: 0, color: "#123456", opacity: 0.65 };
    const textMarker = (value: string, color: string) => ({ enabled: true, marker: {
      type: "text" as const, value,
      position: { anchor: "top-right" as const, offsetX: -2, offsetY: 2 },
      typography: { ...typography, color },
    } });
    const markers = { holidayMarker: textMarker("休", "#123456"), workdayMarker: textMarker("班", "#654321") };
    const baseLayer = createDefaultHolidayLayers()[0];
    const layer = { ...baseLayer,
      main: { ...baseLayer.main, showName: false, ...markers },
      mini: { ...baseLayer.mini, ...markers },
    };
    const calendarSet = createFormalExportCalendarSet({ targetYear: 2027, holidayIndex: new Map([
      ["2027-05-01", { occurrences: [{ layerId: layer.id, calendarId: layer.calendarId, type: "holiday" as const }] }],
      ["2027-05-08", { occurrences: [{ layerId: layer.id, calendarId: layer.calendarId, type: "workday" as const }] }],
    ]) });
    const requirements = collectFormalExportFontRequirements({ calendarSet,
      mainTemplate: testMainTemplate, miniTemplate: testMiniTemplate, holidayLayers: [layer] });
    expect(requirements.get("default-sans")).toContain("休");
    expect(requirements.get("default-sans")).toContain("班");
    const rendered = await renderFormalDocuments({ calendarSet,
      mainTemplate: testMainTemplate, miniTemplate: testMiniTemplate, holidayLayers: [layer],
      mode, fontEngine, assetResolver: { resolve: async () => { throw new Error("Text badges must not request images"); } },
    });
    const full = await composeFullPageDocuments({ targetYear: 2027, documents: rendered, pagePreview: DEFAULT_PAGE_PREVIEW_CONFIG });
    for (const documents of [rendered.main, rendered.mini, full]) {
      const xml = new DOMParser().parseFromString(serializeSvg(documents.get("2027-5")!), "image/svg+xml");
      expect(xml.querySelector("parsererror")).toBeNull();
      expect(xml.querySelector("image")).toBeNull();
      for (const [value, color] of [["休", "#123456"], ["班", "#654321"]]) {
        const badge = xml.querySelector(`[fill="${color}"]`)!;
        expect(badge).not.toBeNull();
        expect(badge.getAttribute("opacity")).toBe("0.65");
        if (mode === "editable") {
          expect(badge.localName).toBe("text");
          expect(badge.textContent).toBe(value);
          expect(badge.getAttribute("font-family")).toBe("Noto Sans SC");
        } else {
          expect(badge.localName).toBe("path");
          const paths = fontEngine.outline({ text: value, typography, originX: 0, baselineY: 0 });
          expect(paths.length).toBeGreaterThan(0);
          expect(badge.getAttribute("d")).toBe(paths[0].d);
          expect(badge.getAttribute("transform")).toContain("translate(");
        }
      }
    }
  });

  it.each([
    ["outlined", "image/png"], ["editable", "image/png"],
    ["outlined", "image/jpeg"], ["editable", "image/jpeg"],
    ["outlined", "image/svg+xml"], ["editable", "image/svg+xml"],
  ] as const)(
    "exports holiday and workday badges in %s mode using %s assets",
    async (mode, mimeType) => {
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
      const workdayMarker = { ...marker, marker: { ...marker.marker, assetId: "workday-badge" } };
      const layer = {
        ...baseLayer,
        main: { ...baseLayer.main, showName: false, holidayMarker: marker, workdayMarker },
        mini: { ...baseLayer.mini, holidayMarker: marker, workdayMarker },
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
          ["2027-05-08", {
            occurrences: [{ layerId: layer.id, calendarId: layer.calendarId, type: "workday" as const }],
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
        assetResolver: {
          resolve: async (assetId) => ({
            bytes: mimeType === "image/svg+xml"
              ? new TextEncoder().encode(assetId === "holiday-badge" ? holidaySvg : workdaySvg).buffer
              : Uint8Array.from(readFileSync(`src/rendering/svg/fixtures/badge.${mimeType === "image/png" ? "png" : "jpg"}`)).buffer,
            mimeType,
          }),
        },
      });

      const full = await composeFullPageDocuments({
        targetYear: 2027, documents: rendered,
        pagePreview: DEFAULT_PAGE_PREVIEW_CONFIG,
      });
      for (const documents of [rendered.main, rendered.mini, full]) {
        const svg = serializeSvg(documents.get("2027-5")!);
        const xml = new DOMParser().parseFromString(svg, "image/svg+xml");
        expect(xml.querySelector("parsererror")).toBeNull();
        if (mimeType !== "image/svg+xml") {
          const bytes = Uint8Array.from(readFileSync(`src/rendering/svg/fixtures/badge.${mimeType === "image/png" ? "png" : "jpg"}`));
          const expectedUri = binaryAssetToDataUri({ bytes: bytes.buffer, mimeType });
          const images = xml.querySelectorAll("image");
          expect(images).toHaveLength(2);
          for (const image of images) {
            expect(image.getAttribute("href")).toBe(expectedUri);
            expect(Number(image.getAttribute("width"))).toBe(16);
            expect(Number(image.getAttribute("height"))).toBe(16);
            expect(image.getAttribute("opacity")).toBe("1");
            expect(image.getAttributeNS("http://www.w3.org/1999/xlink", "href"))
              .toBe(expectedUri);
          }
        } else {
          expect(xml.querySelector("image")).toBeNull();
          for (const source of [holidaySvg, workdaySvg]) {
            const original = new DOMParser().parseFromString(source, "image/svg+xml");
            const path = original.querySelector("path")!;
            expect([...xml.querySelectorAll("path")].some((exported) =>
              exported.getAttribute("d") === path.getAttribute("d") &&
              exported.getAttribute("fill") === path.getAttribute("fill"))).toBe(true);
          }
        }
        expect(xml.querySelector("text") !== null).toBe(mode === "editable");
      }
    },
  );
});
