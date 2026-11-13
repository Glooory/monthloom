import { describe, it, expect } from "vitest";
import { createFullYearCalendarSet } from "./calendarSet";
import { renderFullYearPreviewDocuments } from "./renderDocuments";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import type { AssetResolver } from "../../resources/assets/types";
import { ResolvedFontEngine, type ResolvedFontFace } from "../../resources/fonts/fontkitEngine";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { HolidayLayer } from "../../domain/template/holidayLayer";

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
    expect(rendered.previousMini.size).toBe(15);

    // Verify all 13 main docs exist and have correct dimensions
    for (const doc of rendered.main.values()) {
      expect(doc.width).toBe(testMainTemplate.width);
      expect(doc.height).toBe(testMainTemplate.height);
      expect(doc.children.length).toBeGreaterThan(0);
    }

    // Verify all 15 mini docs exist and have correct dimensions
    for (const doc of rendered.previousMini.values()) {
      expect(doc.width).toBe(testMiniTemplate.width);
      expect(doc.height).toBe(testMiniTemplate.height);
      expect(doc.children.length).toBeGreaterThan(0);
    }
  });

  it("uses template dimensions for Main and both Mini placements", async () => {
    const args = { calendarSet: createFullYearCalendarSet({ targetYear: 2027 }),
      mainTemplate: testMainTemplate, miniTemplate: testMiniTemplate,
      fontEngine: createMockFontEngine(), assetResolver: mockAssetResolver };
    const original = await renderFullYearPreviewDocuments(args);
    const mainTemplate = { ...testMainTemplate, width: 500, height: 700 };
    const miniTemplate = { ...testMiniTemplate, width: 200, height: 300 };
    const resized = await renderFullYearPreviewDocuments({ ...args, mainTemplate, miniTemplate });
    expect(resized.previousMini).toBe(resized.nextMini);
    for (const role of ["main", "previousMini", "nextMini"] as const) {
      const before = original[role].get("2027-1")!;
      const after = resized[role].get("2027-1")!;
      expect(after.width).toBe(role === "main" ? mainTemplate.width : miniTemplate.width);
      expect(after.height).toBe(role === "main" ? mainTemplate.height : miniTemplate.height);
      const paths = (doc: typeof after) => doc.children.filter((node) => node.kind === "path");
      expect(paths(after).length).toBeGreaterThan(0);
      expect(paths(after).map((node) => node.d)).toEqual(paths(before).map((node) => node.d));
      expect(paths(after).map((node) => node.transform?.match(/scale\([^)]+\)/)?.[0]))
        .toEqual(paths(before).map((node) => node.transform?.match(/scale\([^)]+\)/)?.[0]));
    }
    expect(resized.previousMini.size).toBe(15);
    expect(resized.nextMini.size).toBe(15);
    expect(testMainTemplate.width).toBe(DEFAULT_MAIN_TEMPLATE.width);
    expect(testMiniTemplate.height).toBe(DEFAULT_MINI_TEMPLATE.height);
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

    const janMiniWith = renderedWithHolidays.previousMini.get("2027-1");
    const janMiniWithout = renderedWithoutHolidays.previousMini.get("2027-1");
    expect(janMiniWith).toBeDefined();
    expect(janMiniWithout).toBeDefined();
    expect(janMiniWith!.children.length).toBeGreaterThan(
      janMiniWithout!.children.length,
    );
  });
});
