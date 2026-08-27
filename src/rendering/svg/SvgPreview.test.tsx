import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { createSvgDocument } from "./document";
import { SvgPreview } from "./SvgPreview";
import type { SvgNode } from "./ast";

describe("SvgPreview Component", () => {
  it("renders all SVG AST node types to React DOM without changing attributes", () => {
    const nodes: SvgNode[] = [
      {
        kind: "rect",
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        stroke: "#000",
        strokeWidth: 1,
        fill: "#fff",
      },
      {
        kind: "line",
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        stroke: "#333",
        strokeWidth: 2,
      },
      {
        kind: "circle",
        cx: 50,
        cy: 50,
        r: 10,
        fill: "#f00",
      },
      {
        kind: "path",
        d: "M0 0 L10 10",
        transform: "translate(5, 5)",
        fill: "#0f0",
      },
      {
        kind: "text",
        x: 30,
        y: 40,
        text: "Sample Text",
        fontFamily: "Noto Sans",
        fontSize: 14,
        fontWeight: 400,
        fontStyle: "normal",
        letterSpacing: 1,
        fill: "#000",
        opacity: 1,
      },
      {
        kind: "image",
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        href: "data:image/png;base64,iVBORw0KGgo=",
        opacity: 0.9,
      },
    ];

    const doc = createSvgDocument(200, 200, nodes);
    const { container } = render(<SvgPreview document={doc} className="test-svg" />);

    const svgEl = container.querySelector("svg");
    expect(svgEl).toBeDefined();
    expect(svgEl?.getAttribute("width")).toBe("200");
    expect(svgEl?.getAttribute("height")).toBe("200");
    expect(svgEl?.getAttribute("viewBox")).toBe("0 0 200 200");
    expect(svgEl?.getAttribute("class")).toBe("test-svg");

    expect(container.querySelector("rect")).toBeDefined();
    expect(container.querySelector("line")).toBeDefined();
    expect(container.querySelector("circle")).toBeDefined();
    expect(container.querySelector("path")).toBeDefined();
    expect(container.querySelector("text")?.textContent).toBe("Sample Text");
    expect(container.querySelector("image")?.getAttribute("href")).toBe(
      "data:image/png;base64,iVBORw0KGgo=",
    );
  });
});
