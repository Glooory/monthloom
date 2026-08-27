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
