import { describe, expect, it } from "vitest";
import { buildGridBorderNodes, createGridGeometry } from "./geometry";

describe("Grid Geometry", () => {
  it("computes row-major grid cells for 7x4, 7x5, and 7x6 configurations", () => {
    // 7x4
    const grid4 = createGridGeometry({
      x: 0,
      y: 50,
      width: 700,
      height: 420,
      columns: 7,
      rows: 4,
    });

    expect(grid4.cellWidth).toBe(100);
    expect(grid4.cellHeight).toBe(105);
    expect(grid4.cells).toHaveLength(28);
    expect(grid4.cells[0]).toEqual({ x: 0, y: 50, width: 100, height: 105 });
    expect(grid4.cells[1]).toEqual({ x: 100, y: 50, width: 100, height: 105 });
    expect(grid4.cells[7]).toEqual({ x: 0, y: 155, width: 100, height: 105 });

    // 7x5
    const grid5 = createGridGeometry({
      x: 0,
      y: 50,
      width: 700,
      height: 420,
      columns: 7,
      rows: 5,
    });

    expect(grid5.cellWidth).toBe(100);
    expect(grid5.cellHeight).toBe(84);
    expect(grid5.cells).toHaveLength(35);

    // 7x6
    const grid6 = createGridGeometry({
      x: 0,
      y: 50,
      width: 700,
      height: 420,
      columns: 7,
      rows: 6,
    });

    expect(grid6.cellWidth).toBe(100);
    expect(grid6.cellHeight).toBe(70);
    expect(grid6.cells).toHaveLength(42);
    expect(grid6.cells[41]).toEqual({ x: 600, y: 400, width: 100, height: 70 });
  });

  it("builds correct grid border nodes with stroke inset for outer rect and single internal lines", () => {
    const strokeWidth = 1;
    const borderNodes = buildGridBorderNodes({
      bounds: { x: 0, y: 50, width: 700, height: 450 },
      columns: 7,
      rows: 5,
      strokeWidth,
      strokeColor: "#E5E7EB",
      semanticId: "main.grid",
    });

    // 1 outer rect + 6 vertical lines + 4 horizontal lines = 11 nodes
    expect(borderNodes).toHaveLength(11);

    const outerRect = borderNodes[0];
    expect(outerRect.kind).toBe("rect");
    if (outerRect.kind === "rect") {
      expect(outerRect.semanticId).toBe("main.grid");
      expect(outerRect.x).toBe(0.5);
      expect(outerRect.y).toBe(50.5);
      expect(outerRect.width).toBe(699);
      expect(outerRect.height).toBe(449);
      expect(outerRect.stroke).toBe("#E5E7EB");
      expect(outerRect.strokeWidth).toBe(1);
      expect(outerRect.fill).toBe("none");
    }

    const lines = borderNodes.filter((n) => n.kind === "line");
    expect(lines).toHaveLength(10); // 6 vertical + 4 horizontal

    // Check first vertical line (col 1 -> x = 100)
    expect(lines[0]).toEqual({
      kind: "line",
      semanticId: "main.grid",
      x1: 100,
      y1: 50,
      x2: 100,
      y2: 500,
      stroke: "#E5E7EB",
      strokeWidth: 1,
    });

    // Check first horizontal line (row 1 -> y = 50 + 90 = 140)
    expect(lines[6]).toEqual({
      kind: "line",
      semanticId: "main.grid",
      x1: 0,
      y1: 140,
      x2: 700,
      y2: 140,
      stroke: "#E5E7EB",
      strokeWidth: 1,
    });
  });

  it("handles strokeWidth = 2 correctly", () => {
    const borderNodes = buildGridBorderNodes({
      bounds: { x: 10, y: 20, width: 140, height: 100 },
      columns: 7,
      rows: 5,
      strokeWidth: 2,
      strokeColor: "#000000",
      semanticId: "main.grid",
    });

    const outerRect = borderNodes[0];
    if (outerRect.kind === "rect") {
      expect(outerRect.x).toBe(11);
      expect(outerRect.y).toBe(21);
      expect(outerRect.width).toBe(138);
      expect(outerRect.height).toBe(98);
    }
  });

  it("returns empty array if strokeWidth <= 0", () => {
    const borderNodes = buildGridBorderNodes({
      bounds: { x: 0, y: 0, width: 100, height: 100 },
      columns: 7,
      rows: 5,
      strokeWidth: 0,
      strokeColor: "#000000",
      semanticId: "main.grid",
    });

    expect(borderNodes).toEqual([]);
  });

  it("omits bottom border line when omitBottomBorder is true", () => {
    const borderNodes = buildGridBorderNodes({
      bounds: { x: 0, y: 0, width: 700, height: 50 },
      columns: 7,
      rows: 1,
      strokeWidth: 1,
      strokeColor: "#E5E7EB",
      semanticId: "main.grid",
      omitBottomBorder: true,
    });

    // 3 outer lines (top, left, right) + 6 vertical internal lines = 9 line nodes (0 rect nodes)
    expect(borderNodes).toHaveLength(9);
    expect(borderNodes.every((n) => n.kind === "line")).toBe(true);

    // Top line
    expect(borderNodes[0]).toEqual({
      kind: "line",
      semanticId: "main.grid",
      x1: 0,
      y1: 0.5,
      x2: 700,
      y2: 0.5,
      stroke: "#E5E7EB",
      strokeWidth: 1,
    });

    // Left line
    expect(borderNodes[1]).toEqual({
      kind: "line",
      semanticId: "main.grid",
      x1: 0.5,
      y1: 0,
      x2: 0.5,
      y2: 50,
      stroke: "#E5E7EB",
      strokeWidth: 1,
    });

    // Right line
    expect(borderNodes[2]).toEqual({
      kind: "line",
      semanticId: "main.grid",
      x1: 699.5,
      y1: 0,
      x2: 699.5,
      y2: 50,
      stroke: "#E5E7EB",
      strokeWidth: 1,
    });
  });
});

