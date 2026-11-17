import { describe, expect, it } from "vitest";
import { createSvgDocument } from "./document";
import { serializeSvg } from "./serializer";
import { binaryAssetToDataUri } from "../../resources/assets/dataUri";
import holidayMain from "./fixtures/holiday-main.svg?raw";
import workdayMain from "./fixtures/workday-main.svg?raw";
import holidayMini from "./fixtures/holiday-mini.svg?raw";
import workdayMini from "./fixtures/workday-mini.svg?raw";

function serializeAsset(source: string, repeat = 1): string {
  const bytes = new TextEncoder().encode(source);
  const image = {
    kind: "image" as const, x: 10, y: 20, width: 64, height: 64, opacity: 1,
    href: binaryAssetToDataUri({ bytes: bytes.buffer, mimeType: "image/svg+xml" }),
  };
  return serializeSvg(createSvgDocument(200, 200, Array.from({ length: repeat }, () => image)));
}

describe("SVG badge export", () => {
  it.each([holidayMain, workdayMain, holidayMini, workdayMini])(
    "exports the badge as vector paths instead of an SVG image reference",
    (source) => {
      const bytes = new TextEncoder().encode(source);
      const document = createSvgDocument(2000, 1500, [{
        kind: "image", x: 94, y: 135, width: 64, height: 64, opacity: 0.7,
        href: binaryAssetToDataUri({ bytes: bytes.buffer, mimeType: "image/svg+xml" }),
      }]);
      const xml = new DOMParser().parseFromString(serializeSvg(document), "image/svg+xml");
      expect(xml.querySelector("parsererror")).toBeNull();
      expect(xml.querySelector("image")).toBeNull();
      const original = new DOMParser().parseFromString(source, "image/svg+xml");
      const paths = [...xml.querySelectorAll("path")];
      expect(paths).toHaveLength(original.querySelectorAll("path").length);
      for (const [index, path] of [...original.querySelectorAll("path")].entries()) {
        for (const attr of path.attributes) {
          expect(paths[index].getAttribute(attr.name)).toBe(attr.value);
        }
      }
      expect(xml.querySelector('svg[x="94"][y="135"][width="64"][height="64"]')?.getAttribute("viewBox"))
        .toBe(original.documentElement.getAttribute("viewBox"));
      expect(xml.querySelector('g[opacity="0.7"]')).not.toBeNull();
    },
  );

  it("keeps gradient references local to each repeated badge", () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><defs><linearGradient id="paint"><stop offset="0" stop-color="red"/></linearGradient></defs><path d="M0 0L32 32" fill="url(#paint)"/></svg>';
    const xml = new DOMParser().parseFromString(serializeAsset(source, 2), "image/svg+xml");
    const ids = [...xml.querySelectorAll("linearGradient")].map((element) => element.id);
    expect(new Set(ids).size).toBe(2);
    expect([...xml.querySelectorAll("path")].map((path) => path.getAttribute("fill")))
      .toEqual(ids.map((id) => `url(#${id})`));
    expect([...xml.querySelectorAll("svg[x]")].every((svg) => svg.getAttribute("viewBox") === "0 0 32 32")).toBe(true);
  });

  it.each([
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
    '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.com/icon.svg#icon"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(https://example.com/paint)"/></svg>',
    '<svg',
  ])("rejects invalid or active SVG content", (source) => {
    expect(() => serializeAsset(source)).toThrow(/Cannot (inline SVG image|export image asset)/);
  });
});
