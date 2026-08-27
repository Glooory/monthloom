import { describe, expect, it } from "vitest";
import { buildGridGeometry } from "./gridGeometry";
import type { SvgRect, SvgLine } from "../svg/ast";

describe("buildGridGeometry", () => {
  it.each([0.5, 1, 2])(
    "keeps a %s px outer stroke inside the configured bounds",
    (strokeWidth) => {
      const nodes = buildGridGeometry({
        x: 0,
        y: 50,
        width: 700,
        height: 450,
        columns: 7,
        rows: 5,
        strokeWidth,
      });

      const border = nodes[0] as SvgRect;
      expect(border).toMatchObject({
        kind: "rect",
        x: strokeWidth / 2,
        y: 50 + strokeWidth / 2,
        width: 700 - strokeWidth,
        height: 450 - strokeWidth,
        fill: "none",
        strokeWidth,
      });

      // 1 outer rect + 6 vertical lines + 4 horizontal lines = 11 nodes
      expect(nodes).toHaveLength(11);

      const verticalLines = nodes.filter(
        (n): n is SvgLine => n.kind === "line" && n.x1 === n.x2,
      );
      const horizontalLines = nodes.filter(
        (n): n is SvgLine => n.kind === "line" && n.y1 === n.y2,
      );

      expect(verticalLines).toHaveLength(6);
      expect(horizontalLines).toHaveLength(4);

      // Verify vertical lines coordinates
      const expectedColWidth = 700 / 7;
      verticalLines.forEach((line, index) => {
        const expectedX = (index + 1) * expectedColWidth;
        expect(line.x1).toBeCloseTo(expectedX);
        expect(line.x2).toBeCloseTo(expectedX);
        expect(line.y1).toBe(50);
        expect(line.y2).toBe(500);
        expect(line.strokeWidth).toBe(strokeWidth);
      });

      // Verify horizontal lines coordinates
      const expectedRowHeight = 450 / 5;
      horizontalLines.forEach((line, index) => {
        const expectedY = 50 + (index + 1) * expectedRowHeight;
        expect(line.y1).toBeCloseTo(expectedY);
        expect(line.y2).toBeCloseTo(expectedY);
        expect(line.x1).toBe(0);
        expect(line.x2).toBe(700);
        expect(line.strokeWidth).toBe(strokeWidth);
      });
    },
  );
});
