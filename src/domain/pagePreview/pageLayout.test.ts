import { describe, it, expect } from "vitest";
import { calculatePageGeometry as calculate } from "./pageLayout";
import { DEFAULT_PAGE_LAYOUT } from "./defaults";
import type { Anchor } from "../template/primitives";

const mainSize = { width: 700, height: 500 };
const miniSize = { width: 280, height: 210 };
const calculatePageGeometry = (args: { layout: typeof DEFAULT_PAGE_LAYOUT; mainSize?: typeof mainSize; miniSize?: typeof miniSize }) =>
  calculate({ mainSize, miniSize, ...args });

describe("page layout", () => {
  it.each([
    ["top-left", 0, 0], ["top-center", 400, 0], ["top-right", 800, 0],
    ["center-left", 0, 250], ["center", 400, 250], ["center-right", 800, 250],
    ["bottom-left", 0, 500], ["bottom-center", 400, 500], ["bottom-right", 800, 500],
  ] as const)("aligns matching calendar and page anchors: %s", (anchor: Anchor, x, y) => {
    const layout = { ...DEFAULT_PAGE_LAYOUT, width: 1000, height: 600,
      main: { position: { anchor, offsetX: 12, offsetY: -8 } } };
    expect(calculatePageGeometry({ layout, mainSize: { width: 200, height: 100 } }).main).toEqual({ x: x + 12, y: y - 8, width: 200, height: 100 });
  });
  it("keeps the two Mini regions independent", () => {
    const before = calculatePageGeometry({ layout: DEFAULT_PAGE_LAYOUT });
    const layout = { ...DEFAULT_PAGE_LAYOUT, previousMini: { position: { anchor: "bottom-right" as const, offsetX: -10, offsetY: -20 } } };
    const after = calculatePageGeometry({ layout });
    expect(after.main).toEqual(before.main);
    expect(after.nextMini).toEqual(before.nextMini);
    expect(after.previousMini).toEqual({ x: 1110, y: 670, width: 280, height: 210 });
  });
  it("uses shared Mini sizes while preserving independent positions", () => {
    const geometry = calculatePageGeometry({ layout: DEFAULT_PAGE_LAYOUT, miniSize: { width: 400, height: 300 } });
    expect(geometry.previousMini).toMatchObject({ width: 400, height: 300, x: 40, y: 40 });
    expect(geometry.nextMini).toMatchObject({ width: 400, height: 300, x: 40, y: 294 });
  });
  it("keeps right alignment when resizing the page or calendar", () => {
    const layout = { ...DEFAULT_PAGE_LAYOUT, width: 1800,
      main: DEFAULT_PAGE_LAYOUT.main };
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
