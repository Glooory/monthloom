import type { SvgImageNode } from "./ast";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const ALLOWED_ELEMENTS = new Set([
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
  "defs", "clipPath", "mask", "linearGradient", "radialGradient", "stop", "pattern",
  "use", "text", "tspan", "title", "desc",
]);

/** Inline vector assets so SVG importers do not need to decode SVG image URLs. */
export function inlineSvgImage(node: SvgImageNode, prefix: string): string | null {
  const match = /^data:image\/svg\+xml(?:;charset=[^;,]+)?(;base64)?,([\s\S]*)$/i.exec(node.href);
  if (!match) return null;
  const source = match[1]
    ? new TextDecoder().decode(Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0)))
    : decodeURIComponent(match[2]);
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = document.documentElement;
  if (document.querySelector("parsererror") || root.localName !== "svg" || root.namespaceURI !== SVG_NAMESPACE) {
    throw new Error("Cannot export image asset: invalid SVG document");
  }

  const elements = [root, ...root.querySelectorAll("*")];
  const ids = new Map<string, string>();
  for (const element of elements) {
    if (element.namespaceURI !== SVG_NAMESPACE || !ALLOWED_ELEMENTS.has(element.localName)) {
      throw new Error(`Cannot inline SVG image: unsupported element ${element.localName}`);
    }
    const id = element.getAttribute("id");
    if (id) ids.set(id, `${prefix}-${ids.size}`);
  }
  for (const element of elements) {
    for (const attr of [...element.attributes]) {
      if (/^on/i.test(attr.localName) || /(?:javascript:|@import|expression\s*\()/i.test(attr.value)) {
        throw new Error(`Cannot inline SVG image: unsafe attribute ${attr.name}`);
      }
      let value = attr.value;
      if (attr.localName === "id") value = ids.get(value)!;
      if (attr.localName === "href") {
        const referencedId = value.startsWith("#") && ids.get(value.slice(1));
        if (!referencedId) throw new Error("Cannot inline SVG image: unsupported external reference");
        value = `#${referencedId}`;
      }
      value = value.replace(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi, (_, reference: string) => {
        const referencedId = reference.startsWith("#") && ids.get(reference.slice(1));
        if (!referencedId) throw new Error("Cannot inline SVG image: unsupported paint reference");
        return `url(#${referencedId})`;
      });
      attr.value = value;
    }
  }

  if (!root.hasAttribute("viewBox")) {
    const width = Number(root.getAttribute("width"));
    const height = Number(root.getAttribute("height"));
    if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height))) {
      throw new Error("Cannot inline SVG image: missing viewBox or intrinsic dimensions");
    }
    root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  root.setAttribute("x", String(node.x));
  root.setAttribute("y", String(node.y));
  root.setAttribute("width", String(node.width));
  root.setAttribute("height", String(node.height));
  root.setAttribute("overflow", "hidden");
  return `<g opacity="${node.opacity}">${new XMLSerializer().serializeToString(root)}</g>`;
}
