import { describe, it, expect } from "vitest";
import { DEFAULT_PAGE_LAYOUT, DEFAULT_PAGE_PREVIEW_CONFIG } from "./defaults";
import { calculatePageGeometry } from "./pageLayout";
import type { PageLayout } from "./types";

describe("Page Preview Configuration", () => {
  it("defines valid default page layout", () => {
    expect(DEFAULT_PAGE_LAYOUT.width).toBeGreaterThan(0);
    expect(DEFAULT_PAGE_LAYOUT.height).toBeGreaterThan(0);
    expect(DEFAULT_PAGE_LAYOUT.padding).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_PAGE_LAYOUT.leftColumnRatio).toBeGreaterThan(0);
    expect(DEFAULT_PAGE_LAYOUT.leftColumnRatio).toBeLessThan(1);
    expect(DEFAULT_PAGE_LAYOUT.columnGap).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_PAGE_LAYOUT.miniHeightRatio).toBeGreaterThan(0);
    expect(DEFAULT_PAGE_LAYOUT.miniHeightRatio).toBeLessThanOrEqual(1);
    expect(DEFAULT_PAGE_LAYOUT.miniGap).toBeGreaterThanOrEqual(0);
  });

  it("defines default page preview config", () => {
    expect(DEFAULT_PAGE_PREVIEW_CONFIG.layout).toEqual(DEFAULT_PAGE_LAYOUT);
    expect(DEFAULT_PAGE_PREVIEW_CONFIG.backgroundAssetId).toBeUndefined();
  });
});

describe("calculatePageGeometry", () => {
  const mainSize = { width: 1000, height: 700 } as const;
  const miniSize = { width: 300, height: 200 } as const;

  it("uses explicit dimensions to fill the main calendar height without a top gap", () => {
    const layout = { ...DEFAULT_PAGE_LAYOUT, mainWidth: 894, mainHeight: 820,
      miniWidth: 300, miniHeight: 220, mainVerticalAlignment: "bottom" as const,
      miniVerticalAlignment: "bottom" as const };
    const geometry = calculatePageGeometry({ layout, mainSize, miniSize });
    expect(geometry.main).toMatchObject({ x: 466, y: 40, width: 894, height: 820 });
    expect(geometry.previousMini).toMatchObject({ x: 40, width: 300, height: 220 });
    expect(geometry.nextMini.y + geometry.nextMini.height).toBe(860);
    expect(geometry.nextMini.y - geometry.previousMini.y).toBe(244);
    expect(geometry.warnings).toEqual([]);
    const largerPage = calculatePageGeometry({ layout: { ...layout, width: 1800, height: 1200 }, mainSize, miniSize });
    expect(largerPage.main.width).toBe(894);
    expect(largerPage.main.height).toBe(820);
    expect(largerPage.previousMini.width).toBe(300);
    expect(largerPage.previousMini.height).toBe(220);
  });

  it.each([
    { width: 1400, padding: 40, mainWidth: 894, miniWidth: 300, columnGap: 0 },
    { width: 1800, padding: 60, mainWidth: 1000, miniWidth: 200, columnGap: 500 },
    { width: 1400, padding: 40, mainWidth: 1500, miniWidth: 300, columnGap: 30 },
  ])("keeps the main calendar right margin equal to page padding: %j", (settings) => {
    const geometry = calculatePageGeometry({
      layout: { ...DEFAULT_PAGE_LAYOUT, ...settings }, mainSize, miniSize,
    });
    expect(geometry.page.width - geometry.main.x - geometry.main.width).toBe(settings.padding);
  });

  it("ignores the legacy column gap when dimensions are explicit", () => {
    const layout = { ...DEFAULT_PAGE_LAYOUT, mainWidth: 1000, mainHeight: 820,
      miniWidth: 300, miniHeight: 220 };
    const geometry = calculatePageGeometry({ layout, mainSize, miniSize });
    expect(geometry.warnings).toEqual([]);
    expect(calculatePageGeometry({ layout: { ...layout, columnGap: 2000 }, mainSize, miniSize }))
      .toEqual(geometry);
  });

  it("reports overflow for explicit dimensions without shrinking them", () => {
    const geometry = calculatePageGeometry({
      layout: { ...DEFAULT_PAGE_LAYOUT, mainWidth: 1100, mainHeight: 1000,
        miniWidth: 400, miniHeight: 500 }, mainSize, miniSize,
    });
    expect(geometry.main.width).toBe(1100);
    expect(geometry.main.height).toBe(1000);
    expect(geometry.previousMini.height).toBe(500);
    expect(geometry.warnings.map((warning) => warning.code)).toEqual([
      "calendar-width-overflow", "main-height-overflow", "mini-stack-overflow",
    ]);
  });

  it.each([0.28, 0.45])("bottom-aligns rendered calendars with mini height ratio %s", (miniHeightRatio) => {
    const geometry = calculatePageGeometry({
      layout: { ...DEFAULT_PAGE_LAYOUT, miniHeightRatio, mainVerticalAlignment: "bottom", miniVerticalAlignment: "bottom" },
      mainSize,
      miniSize,
    });
    const bottom = geometry.content.y + geometry.content.height;
    expect(geometry.main.y + geometry.main.height).toBeCloseTo(bottom);
    expect(geometry.nextMini.y + geometry.nextMini.height).toBeCloseTo(bottom);
    expect(geometry.previousMini.y).toBeLessThan(geometry.nextMini.y);
    expect(geometry.nextMiniSlot.y - geometry.previousMiniSlot.y)
      .toBeCloseTo(geometry.previousMiniSlot.height + DEFAULT_PAGE_LAYOUT.miniGap);
  });

  it("centers each column independently", () => {
    const geometry = calculatePageGeometry({
      layout: { ...DEFAULT_PAGE_LAYOUT, mainVerticalAlignment: "center", miniVerticalAlignment: "center" },
      mainSize,
      miniSize,
    });
    const center = geometry.content.y + geometry.content.height / 2;
    expect(geometry.main.y + geometry.main.height / 2).toBeCloseTo(center);
    expect((geometry.previousMini.y + geometry.nextMini.y + geometry.nextMini.height) / 2).toBeCloseTo(center);
    const mainOnly = calculatePageGeometry({
      layout: { ...DEFAULT_PAGE_LAYOUT, mainVerticalAlignment: "bottom" }, mainSize, miniSize,
    });
    const original = calculatePageGeometry({ layout: DEFAULT_PAGE_LAYOUT, mainSize, miniSize });
    expect(mainOnly.previousMini).toEqual(original.previousMini);
    expect(mainOnly.nextMini).toEqual(original.nextMini);
  });

  it("preserves legacy layouts without alignment settings", () => {
    const legacy = { ...DEFAULT_PAGE_LAYOUT };
    delete legacy.mainVerticalAlignment;
    delete legacy.miniVerticalAlignment;
    expect(calculatePageGeometry({ layout: legacy, mainSize, miniSize }))
      .toEqual(calculatePageGeometry({ layout: DEFAULT_PAGE_LAYOUT, mainSize, miniSize }));
  });

  it("keeps overflowing calendars at the top and reports warnings", () => {
    const geometry = calculatePageGeometry({
      layout: { ...DEFAULT_PAGE_LAYOUT, mainVerticalAlignment: "bottom", miniVerticalAlignment: "bottom", miniHeightRatio: 0.8 },
      mainSize: { width: 1000, height: 1200 }, miniSize: { width: 200, height: 1000 },
    });
    expect(geometry.main.y).toBe(geometry.content.y);
    expect(geometry.previousMini.y).toBeCloseTo(geometry.content.y);
    expect(geometry.warnings.map((warning) => warning.code)).toEqual(["main-height-overflow", "mini-stack-overflow"]);
  });

  it("computes content area correctly", () => {
    const layout: PageLayout = {
      width: 1400,
      height: 900,
      padding: 40,
      leftColumnRatio: 0.3,
      columnGap: 30,
      miniHeightRatio: 0.28,
      miniGap: 24,
    };

    const geometry = calculatePageGeometry({ layout, mainSize, miniSize });

    expect(geometry.page).toEqual({ x: 0, y: 0, width: 1400, height: 900 });
    expect(geometry.content).toEqual({ x: 40, y: 40, width: 1320, height: 820 });
  });

  it("computes column geometry and available main width correctly", () => {
    const layout: PageLayout = {
      width: 1400,
      height: 900,
      padding: 40,
      leftColumnRatio: 0.3,
      columnGap: 30,
      miniHeightRatio: 0.28,
      miniGap: 24,
    };

    const geometry = calculatePageGeometry({ layout, mainSize, miniSize });

    // content.width = 1320
    // leftColumn.width = 1320 * 0.3 = 396
    expect(geometry.leftColumn).toEqual({ x: 40, y: 40, width: 396, height: 820 });

    // availableMainWidth = 1320 - 396 - 30 = 894
    // mainScale = 894 / 1000 = 0.894
    // renderedMainHeight = 700 * 0.894 = 625.8
    expect(geometry.main.x).toBe(40 + 396 + 30);
    expect(geometry.main.y).toBe(40);
    expect(geometry.main.width).toBeCloseTo(894);
    expect(geometry.main.height).toBeCloseTo(625.8);
    expect(geometry.main.scale).toBeCloseTo(0.894);
    expect(geometry.warnings).toHaveLength(0);
  });

  it("warns when rendered main height exceeds content height without distorting scale", () => {
    const tallMainSize = { width: 1000, height: 1200 };
    const layout: PageLayout = {
      width: 1400,
      height: 900,
      padding: 40,
      leftColumnRatio: 0.3,
      columnGap: 30,
      miniHeightRatio: 0.28,
      miniGap: 24,
    };

    const geometry = calculatePageGeometry({ layout, mainSize: tallMainSize, miniSize });

    // mainScale = 894 / 1000 = 0.894
    // renderedMainHeight = 1200 * 0.894 = 1072.8 > 820
    expect(geometry.main.height).toBeCloseTo(1072.8);
    expect(geometry.main.scale).toBeCloseTo(0.894);
    expect(geometry.warnings.some((w) => w.code === "main-height-overflow")).toBe(true);
  });

  it("computes mini slots and applies contain scaling with centering", () => {
    const layout: PageLayout = {
      width: 1400,
      height: 900,
      padding: 40,
      leftColumnRatio: 0.3,
      columnGap: 30,
      miniHeightRatio: 0.28,
      miniGap: 24,
    };

    // contentHeight = 820
    // miniSlotHeight = 820 * 0.28 = 229.6
    // miniSlotWidth = 396
    // miniSize = 300 x 200
    // scaleX = 396 / 300 = 1.32
    // scaleY = 229.6 / 200 = 1.148
    // miniScale = 1.148
    // renderedWidth = 300 * 1.148 = 344.4
    // renderedHeight = 200 * 1.148 = 229.6
    // previousSlot: x=40, y=40, width=396, height=229.6
    // nextSlot: x=40, y=40 + 229.6 + 24 = 293.6, width=396, height=229.6
    const geometry = calculatePageGeometry({ layout, mainSize, miniSize });

    expect(geometry.previousMiniSlot.x).toBe(40);
    expect(geometry.previousMiniSlot.y).toBe(40);
    expect(geometry.previousMiniSlot.width).toBeCloseTo(396);
    expect(geometry.previousMiniSlot.height).toBeCloseTo(229.6);

    expect(geometry.nextMiniSlot.x).toBe(40);
    expect(geometry.nextMiniSlot.y).toBeCloseTo(293.6);
    expect(geometry.nextMiniSlot.width).toBeCloseTo(396);
    expect(geometry.nextMiniSlot.height).toBeCloseTo(229.6);

    expect(geometry.previousMini.scale).toBeCloseTo(1.148);
    expect(geometry.previousMini.width).toBeCloseTo(344.4);
    expect(geometry.previousMini.height).toBeCloseTo(229.6);
    // Centered horizontally: 40 + (396 - 344.4) / 2 = 65.8
    expect(geometry.previousMini.x).toBeCloseTo(65.8);
    expect(geometry.previousMini.y).toBeCloseTo(40);

    expect(geometry.nextMini.x).toBeCloseTo(65.8);
    expect(geometry.nextMini.y).toBeCloseTo(293.6);
  });

  it("warns when mini stack height exceeds content height", () => {
    const layout: PageLayout = {
      width: 1400,
      height: 900,
      padding: 40,
      leftColumnRatio: 0.3,
      columnGap: 30,
      miniHeightRatio: 0.6, // 2 * 0.6 * 820 + 24 = 984 + 24 = 1008 > 820
      miniGap: 24,
    };

    const geometry = calculatePageGeometry({ layout, mainSize, miniSize });
    expect(geometry.warnings.some((w) => w.code === "mini-stack-overflow")).toBe(true);
  });

  it("warns on invalid content area when padding or gaps are too large", () => {
    const invalidLayout: PageLayout = {
      width: 400,
      height: 400,
      padding: 250, // 2 * 250 = 500 > 400
      leftColumnRatio: 0.3,
      columnGap: 30,
      miniHeightRatio: 0.28,
      miniGap: 24,
    };

    const geometry = calculatePageGeometry({ layout: invalidLayout, mainSize, miniSize });
    expect(geometry.warnings.some((w) => w.code === "invalid-content-area")).toBe(true);
  });
});
