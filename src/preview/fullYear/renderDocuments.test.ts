import { describe, it, expect } from "vitest";
import { createFullYearCalendarSet } from "./calendarSet";
import { renderFullYearPreviewDocuments } from "./renderDocuments";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import type { AssetResolver } from "../../resources/assets/types";
import { ResolvedFontEngine, type ResolvedFontFace } from "../../resources/fonts/fontkitEngine";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { HolidayLayer } from "../../domain/template/holidayLayer";
import { DEFAULT_PAGE_LAYOUT } from "../../domain/pagePreview/defaults";
import { calculatePageGeometry } from "../../domain/pagePreview/pageLayout";

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

describe("renderFullYearPreviewDocuments", () => {
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

  it("renders exactly 13 unique Main and 15 unique Mini SvgDocuments", async () => {
    const calendarSet = createFullYearCalendarSet({ targetYear: 2027 });
    const fontEngine = createMockFontEngine();

    const rendered = await renderFullYearPreviewDocuments({
      calendarSet,
      mainTemplate: testMainTemplate,
      miniTemplate: testMiniTemplate,
      fontEngine,
      assetResolver: mockAssetResolver,
    });

    expect(rendered.main.size).toBe(13);
    expect(rendered.mini.size).toBe(15);

    // Verify all 13 main docs exist and have correct dimensions
    for (const doc of rendered.main.values()) {
      expect(doc.width).toBe(testMainTemplate.width);
      expect(doc.height).toBe(testMainTemplate.height);
      expect(doc.children.length).toBeGreaterThan(0);
    }

    // Verify all 15 mini docs exist and have correct dimensions
    for (const doc of rendered.mini.values()) {
      expect(doc.width).toBe(testMiniTemplate.width);
      expect(doc.height).toBe(testMiniTemplate.height);
      expect(doc.children.length).toBeGreaterThan(0);
    }
  });

  it.each([
    { mainWidth: 500, mainHeight: 700, miniWidth: 200, miniHeight: 300 },
    { mainWidth: 500 },
    { miniWidth: 200 },
    { mainHeight: 700, miniHeight: 300 },
  ])("reflows explicit preview dimensions without scaling glyphs: %j", async (dimensions) => {
    const calendarSet = createFullYearCalendarSet({ targetYear: 2027 });
    const fontEngine = createMockFontEngine();
    const args = {
      calendarSet, mainTemplate: testMainTemplate, miniTemplate: testMiniTemplate,
      fontEngine, assetResolver: mockAssetResolver,
    };
    const pageLayout = { ...DEFAULT_PAGE_LAYOUT, ...dimensions };
    const geometry = calculatePageGeometry({
      layout: pageLayout, mainSize: testMainTemplate, miniSize: testMiniTemplate,
    });
    const original = await renderFullYearPreviewDocuments(args);
    const resized = await renderFullYearPreviewDocuments({ ...args, pageLayout });
    for (const [kind, placement] of [["main", geometry.main], ["mini", geometry.previousMini]] as const) {
      const explicit = kind === "main"
        ? dimensions.mainWidth !== undefined || dimensions.mainHeight !== undefined
        : dimensions.miniWidth !== undefined || dimensions.miniHeight !== undefined;
      const before = original[kind].get("2027-1")!;
      const after = resized[kind].get("2027-1")!;
      if (!explicit) {
        expect(after).toEqual(before);
        continue;
      }
      expect(after.width).toBe(placement.width);
      expect(after.height).toBe(placement.height);
      expect(after.viewBox).toBe(`0 0 ${placement.width} ${placement.height}`);
      const beforePaths = before.children.filter((node) => node.kind === "path");
      const afterPaths = after.children.filter((node) => node.kind === "path");
      expect(afterPaths.length).toBeGreaterThan(0);
      expect(afterPaths[0].transform).toMatch(/scale\([^)]+\)/);
      expect(afterPaths.map((node) => node.d)).toEqual(beforePaths.map((node) => node.d));
      expect(afterPaths.map((node) => node.transform?.match(/scale\([^)]+\)/)?.[0]))
        .toEqual(beforePaths.map((node) => node.transform?.match(/scale\([^)]+\)/)?.[0]));
      expect(afterPaths[0].transform).not.toBe(beforePaths[0].transform);
    }
    expect(testMainTemplate.width).toBe(DEFAULT_MAIN_TEMPLATE.width);
    expect(testMiniTemplate.height).toBe(DEFAULT_MINI_TEMPLATE.height);
  });

  it("preserves template documents for legacy preview layouts", async () => {
    const args = {
      calendarSet: createFullYearCalendarSet({ targetYear: 2027 }),
      mainTemplate: testMainTemplate, miniTemplate: testMiniTemplate,
      fontEngine: createMockFontEngine(), assetResolver: mockAssetResolver,
    };
    expect(await renderFullYearPreviewDocuments({ ...args, pageLayout: DEFAULT_PAGE_LAYOUT }))
      .toEqual(await renderFullYearPreviewDocuments(args));
  });

  it("renders holiday names and markers in Main and markers only in Mini", async () => {
    const holidayIndex = new Map([
      [
        "2027-01-01",
        {
          occurrences: [
            {
              layerId: "layer-cn",
              calendarId: "cn",
              type: "holiday" as const,
              name: "元旦",
            },
          ],
        },
      ],
    ]);
    const calendarSet = createFullYearCalendarSet({
      targetYear: 2027,
      holidayIndex,
    });
    const fontEngine = createMockFontEngine();
    const holidayLayers: HolidayLayer[] = [
      {
        id: "layer-cn",
        calendarId: "cn",
        enabled: true,
        main: {
          showName: true,
          name: {
            position: { anchor: "bottom-left", offsetX: 0, offsetY: 0 },
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
          holidayMarker: {
            enabled: true,
            marker: {
              type: "text",
              value: "休",
              position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
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
          },
          workdayMarker: {
            enabled: false,
            marker: {
              type: "text",
              value: "班",
              position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
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
          dateColors: { enabled: false, holiday: "#DC2626", workday: "#1F2937" },
        },
        mini: {
          holidayMarker: {
            enabled: true,
            marker: {
              type: "text",
              value: "•",
              position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
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
          },
          workdayMarker: {
            enabled: false,
            marker: {
              type: "text",
              value: "•",
              position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
              typography: {
                fontId: "default-sans",
                fontSize: 10,
                fontWeight: 400,
                fontStyle: "normal",
                letterSpacing: 0,
                color: "#6B7280",
                opacity: 1,
              },
            },
          },
          dateColors: { enabled: false, holiday: "#DC2626", workday: "#1F2937" },
        },
      },
    ];

    const renderedWithHolidays = await renderFullYearPreviewDocuments({
      calendarSet,
      mainTemplate: testMainTemplate,
      miniTemplate: testMiniTemplate,
      holidayLayers,
      fontEngine,
      assetResolver: mockAssetResolver,
    });

    const renderedWithoutHolidays = await renderFullYearPreviewDocuments({
      calendarSet,
      mainTemplate: testMainTemplate,
      miniTemplate: testMiniTemplate,
      holidayLayers: [],
      fontEngine,
      assetResolver: mockAssetResolver,
    });

    const janMainWith = renderedWithHolidays.main.get("2027-1");
    const janMainWithout = renderedWithoutHolidays.main.get("2027-1");
    expect(janMainWith).toBeDefined();
    expect(janMainWithout).toBeDefined();
    expect(janMainWith!.children.length).toBeGreaterThan(
      janMainWithout!.children.length,
    );

    const janMiniWith = renderedWithHolidays.mini.get("2027-1");
    const janMiniWithout = renderedWithoutHolidays.mini.get("2027-1");
    expect(janMiniWith).toBeDefined();
    expect(janMiniWithout).toBeDefined();
    expect(janMiniWith!.children.length).toBeGreaterThan(
      janMiniWithout!.children.length,
    );
  });
});
