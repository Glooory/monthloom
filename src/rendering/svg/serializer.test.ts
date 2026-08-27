import { describe, expect, it } from "vitest";
import { createSvgDocument } from "./document";
import { serializeSvg } from "./serializer";
import type {
  SvgCircleNode,
  SvgGroupNode,
  SvgImageNode,
  SvgLineNode,
  SvgPathNode,
  SvgRectNode,
  SvgTextNode,
} from "./ast";

describe("Production SVG Serializer", () => {
  it("serializes root svg with exact dimensions and viewBox", () => {
    const doc = createSvgDocument(700, 500, []);
    const svg = serializeSvg(doc);

    expect(svg).toContain('width="700"');
    expect(svg).toContain('height="500"');
    expect(svg).toContain('viewBox="0 0 700 500"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("escapes special characters in text and attributes", () => {
    const textNode: SvgTextNode = {
      kind: "text",
      x: 10,
      y: 20,
      text: "Rock & Roll <5> >3",
      fontFamily: 'Foo "Bar" & Baz',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: "normal",
      letterSpacing: 0,
      fill: "#000",
      opacity: 1,
    };

    const doc = createSvgDocument(100, 100, [textNode]);
    const svg = serializeSvg(doc);

    expect(svg).toContain("Rock &amp; Roll &lt;5&gt; &gt;3");
    expect(svg).toContain('font-family="Foo &quot;Bar&quot; &amp; Baz"');
  });

  it("serializes all AST node types accurately without altering numbers", () => {
    const rect: SvgRectNode = {
      kind: "rect",
      x: 0.5,
      y: 1.5,
      width: 100.25,
      height: 50.75,
      stroke: "#112233",
      strokeWidth: 1.5,
      fill: "none",
      opacity: 0.8,
    };

    const line: SvgLineNode = {
      kind: "line",
      x1: 10.5,
      y1: 20.5,
      x2: 110.5,
      y2: 20.5,
      stroke: "#445566",
      strokeWidth: 1,
    };

    const circle: SvgCircleNode = {
      kind: "circle",
      cx: 30,
      cy: 40,
      r: 5.5,
      fill: "#ff0000",
      opacity: 0.9,
    };

    const image: SvgImageNode = {
      kind: "image",
      x: 5,
      y: 10,
      width: 24,
      height: 24,
      href: "data:image/png;base64,iVBORw0KGgo=",
      opacity: 1,
    };

    const path: SvgPathNode = {
      kind: "path",
      d: "M0 0 L10 10 Z",
      transform: "translate(15.5, 25.5) scale(0.02, -0.02)",
      fill: "#333333",
      opacity: 0.5,
    };

    const group: SvgGroupNode = {
      kind: "group",
      opacity: 0.7,
      children: [rect, line],
    };

    const doc = createSvgDocument(200, 200, [group, circle, image, path]);
    const svg = serializeSvg(doc);

    // Group
    expect(svg).toContain('<g opacity="0.7">');

    // Rect
    expect(svg).toContain('x="0.5" y="1.5" width="100.25" height="50.75"');
    expect(svg).toContain('stroke="#112233" stroke-width="1.5" fill="none" opacity="0.8"');

    // Line
    expect(svg).toContain('x1="10.5" y1="20.5" x2="110.5" y2="20.5" stroke="#445566" stroke-width="1"');

    // Circle
    expect(svg).toContain('cx="30" cy="40" r="5.5" fill="#ff0000" opacity="0.9"');

    // Image
    expect(svg).toContain('href="data:image/png;base64,iVBORw0KGgo="');

    // Path
    expect(svg).toContain('d="M0 0 L10 10 Z"');
    expect(svg).toContain('transform="translate(15.5, 25.5) scale(0.02, -0.02)"');
    expect(svg).toContain('fill="#333333" opacity="0.5"');
  });

  it("serializes editable text node attributes accurately", () => {
    const textNode: SvgTextNode = {
      kind: "text",
      x: 114,
      y: 76,
      text: "31",
      fontFamily: "Noto Sans",
      fontSize: 20,
      fontWeight: 700,
      fontStyle: "italic",
      letterSpacing: 2,
      fill: "#111111",
      opacity: 0.6,
    };

    const doc = createSvgDocument(300, 200, [textNode]);
    const svg = serializeSvg(doc);

    expect(svg).toContain(
      '<text x="114" y="76" font-family="Noto Sans" font-size="20" font-weight="700" font-style="italic" letter-spacing="2" fill="#111111" opacity="0.6">31</text>',
    );
  });
});
