import { describe, expect, it } from "vitest";
import { serializeSvg } from "./serializeSvg";
import type { SvgDocument } from "./ast";

describe("serializeSvg", () => {
  it("serializes exact dimensions and viewBox", () => {
    const document: SvgDocument = {
      width: 700,
      height: 500,
      viewBox: "0 0 700 500",
      children: [],
    };

    const svg = serializeSvg(document);

    expect(svg).toContain('width="700"');
    expect(svg).toContain('height="500"');
    expect(svg).toContain('viewBox="0 0 700 500"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("serializes groups, paths, lines, rects, and images with attributes and escaping", () => {
    const document: SvgDocument = {
      width: 700,
      height: 500,
      viewBox: "0 0 700 500",
      children: [
        {
          kind: "group",
          opacity: 0.8,
          children: [
            {
              kind: "rect",
              x: 10,
              y: 20,
              width: 100,
              height: 50,
              fill: "none",
              stroke: "#000",
              strokeWidth: 1,
            },
            {
              kind: "line",
              x1: 0,
              y1: 0,
              x2: 100,
              y2: 100,
              stroke: "#333",
              strokeWidth: 0.5,
            },
            {
              kind: "path",
              d: "M 0 0 L 10 10 Z",
              fill: "#111",
              transform: 'translate(10, 20) scale(1, -1)',
            },
            {
              kind: "image",
              x: 5,
              y: 5,
              width: 20,
              height: 20,
              href: "data:image/png;base64,abc<>&\"",
              opacity: 0.9,
            },
          ],
        },
      ],
    };

    const svg = serializeSvg(document);
    expect(svg).toContain('<g opacity="0.8">');
    expect(svg).toContain('<rect x="10" y="20" width="100" height="50" fill="none" stroke="#000" stroke-width="1"/>');
    expect(svg).toContain('<line x1="0" y1="0" x2="100" y2="100" stroke="#333" stroke-width="0.5"/>');
    expect(svg).toContain('<path d="M 0 0 L 10 10 Z" transform="translate(10, 20) scale(1, -1)" fill="#111"/>');
    expect(svg).toContain('href="data:image/png;base64,abc&lt;&gt;&amp;&quot;"');
    expect(svg).toContain('opacity="0.9"');
    expect(svg).toContain('</g>');
  });
});
