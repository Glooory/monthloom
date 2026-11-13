import { describe, it, expect } from "vitest";
import { calculatePageGeometry } from "./pageLayout";
import { DEFAULT_PAGE_LAYOUT } from "./defaults";
import type { Anchor } from "../template/primitives";

describe("page layout", () => {
  it.each([
    ["top-left", 0, 0], ["top-center", 400, 0], ["top-right", 800, 0],
    ["center-left", 0, 250], ["center", 400, 250], ["center-right", 800, 250],
    ["bottom-left", 0, 500], ["bottom-center", 400, 500], ["bottom-right", 800, 500],
  ] as const)("aligns matching calendar and page anchors: %s", (anchor: Anchor, x, y) => {
    const layout = { ...DEFAULT_PAGE_LAYOUT, width: 1000, height: 600,
      main: { width: 200, height: 100, position: { anchor, offsetX: 12, offsetY: -8 } } };
    expect(calculatePageGeometry({ layout }).main).toEqual({ x: x + 12, y: y - 8, width: 200, height: 100 });
  });
  it("keeps the two Mini regions independent", () => {
    const before = calculatePageGeometry({ layout: DEFAULT_PAGE_LAYOUT });
    const layout = { ...DEFAULT_PAGE_LAYOUT, previousMini: { width: 123, height: 456,
      position: { anchor: "bottom-right" as const, offsetX: -10, offsetY: -20 } } };
    const after = calculatePageGeometry({ layout });
    expect(after.main).toEqual(before.main);
    expect(after.nextMini).toEqual(before.nextMini);
    expect(after.previousMini).toEqual({ x: 1267, y: 424, width: 123, height: 456 });
  });
  it("keeps right alignment when resizing the page or calendar", () => {
    const layout = { ...DEFAULT_PAGE_LAYOUT, width: 1800,
      main: { ...DEFAULT_PAGE_LAYOUT.main, width: 700 } };
    const { main } = calculatePageGeometry({ layout });
    expect(main.x + main.width).toBe(1760);
  });
  it("warns for off-page calendars without clamping their positions", () => {
    const layout = { ...DEFAULT_PAGE_LAYOUT, main: { ...DEFAULT_PAGE_LAYOUT.main,
      position: { anchor: "top-left" as const, offsetX: -10, offsetY: 0 } } };
    const geometry = calculatePageGeometry({ layout });
    expect(geometry.main.x).toBe(-10);
    expect(geometry.warnings).toHaveLength(1);
    expect(calculatePageGeometry({ layout: DEFAULT_PAGE_LAYOUT }).warnings).toEqual([]);
  });
});
