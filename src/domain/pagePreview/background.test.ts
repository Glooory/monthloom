import { describe, expect, it } from "vitest";
import { fitBackground, getPageBackground, resizeBackground } from "./background";
import { DEFAULT_PAGE_PREVIEW_CONFIG } from "./defaults";

describe("monthly backgrounds", () => {
  it("inherits legacy backgrounds and supports independent replacement and clearing", () => {
    const config = { ...DEFAULT_PAGE_PREVIEW_CONFIG, backgroundAssetId: "shared", backgrounds: {
      "2027-1": { assetId: "january" }, "2027-2": null,
    } };
    expect(getPageBackground(config, "2027-1")).toEqual({ assetId: "january" });
    expect(getPageBackground(config, "2027-2")).toBeNull();
    expect(getPageBackground(config, "2028-1")).toEqual({ assetId: "shared" });
    expect(getPageBackground(DEFAULT_PAGE_PREVIEW_CONFIG, "2027-1")).toBeNull();
  });

  it("centers cover and contain without distorting the image", () => {
    expect(fitBackground({ width: 100, height: 100 }, { width: 200, height: 100 }))
      .toEqual({ x: -50, y: 0, width: 200, height: 100 });
    expect(fitBackground({ width: 100, height: 100 }, { width: 200, height: 100 }, "contain"))
      .toEqual({ x: 0, y: 25, width: 100, height: 50 });
  });

  it.each(["nw", "ne", "sw", "se"] as const)("resizes from %s while fixing the opposite corner and aspect ratio", (corner) => {
    const rect = { x: -30, y: 20, width: 200, height: 100 };
    const next = resizeBackground(rect, 40, 20, corner);
    expect(next.width / next.height).toBe(2);
    expect(corner.includes("w") ? next.x + next.width : next.x)
      .toBe(corner.includes("w") ? rect.x + rect.width : rect.x);
    expect(corner.includes("n") ? next.y + next.height : next.y)
      .toBe(corner.includes("n") ? rect.y + rect.height : rect.y);
  });

  it("prevents resizing through the fixed corner", () => {
    const next = resizeBackground({ x: 0, y: 0, width: 200, height: 100 }, -1000, -1000, "se");
    expect(next.width).toBe(2);
    expect(next.height).toBe(1);
  });
});
