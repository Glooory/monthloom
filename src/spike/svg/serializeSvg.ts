import type { SvgDocument, SvgNode, SvgAttributes } from "./ast";

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function serializeAttributes(attrs: SvgAttributes): string {
  const parts: string[] = [];
  if (attrs.fill !== undefined) parts.push(`fill="${escapeXmlAttr(attrs.fill)}"`);
  if (attrs.stroke !== undefined) parts.push(`stroke="${escapeXmlAttr(attrs.stroke)}"`);
  if (attrs.strokeWidth !== undefined) parts.push(`stroke-width="${attrs.strokeWidth}"`);
  if (attrs.opacity !== undefined) parts.push(`opacity="${attrs.opacity}"`);
  return parts.length > 0 ? " " + parts.join(" ") : "";
}

function serializeNode(node: SvgNode): string {
  switch (node.kind) {
    case "group": {
      const opacityAttr = node.opacity !== undefined ? ` opacity="${node.opacity}"` : "";
      const childrenXml = node.children.map(serializeNode).join("");
      return `<g${opacityAttr}>${childrenXml}</g>`;
    }
    case "path": {
      const common = serializeAttributes(node);
      const transformAttr = node.transform ? ` transform="${escapeXmlAttr(node.transform)}"` : "";
      return `<path d="${escapeXmlAttr(node.d)}"${transformAttr}${common}/>`;
    }
    case "line": {
      const common = serializeAttributes(node);
      return `<line x1="${node.x1}" y1="${node.y1}" x2="${node.x2}" y2="${node.y2}"${common}/>`;
    }
    case "rect": {
      const common = serializeAttributes(node);
      return `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"${common}/>`;
    }
    case "image": {
      const opacityAttr = node.opacity !== undefined ? ` opacity="${node.opacity}"` : "";
      return `<image x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" href="${escapeXmlAttr(node.href)}"${opacityAttr}/>`;
    }
  }
}

export function serializeSvg(document: SvgDocument): string {
  const childrenXml = document.children.map(serializeNode).join("");
  return `<svg width="${document.width}" height="${document.height}" viewBox="${document.viewBox}" xmlns="http://www.w3.org/2000/svg">${childrenXml}</svg>`;
}
