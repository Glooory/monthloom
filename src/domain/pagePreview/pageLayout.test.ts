import { describe, it, expect } from "vitest";
import { DEFAULT_PAGE_LAYOUT, DEFAULT_PAGE_PREVIEW_CONFIG } from "./defaults";

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
