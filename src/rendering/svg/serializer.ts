import type {
  SvgCircleNode,
  SvgGroupNode,
  SvgImageNode,
  SvgLineNode,
  SvgNode,
  SvgPathNode,
  SvgRectNode,
  SvgTextNode,
} from "./ast";
import type { SvgDocument } from "./document";

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function serializePath(node: SvgPathNode): string {
  const attrs: string[] = [`d="${escapeXmlAttr(node.d)}"`];
  if (node.transform) attrs.push(`transform="${escapeXmlAttr(node.transform)}"`);
  if (node.fill !== undefined) attrs.push(`fill="${escapeXmlAttr(node.fill)}"`);
  if (node.stroke !== undefined) attrs.push(`stroke="${escapeXmlAttr(node.stroke)}"`);
  if (node.strokeWidth !== undefined) attrs.push(`stroke-width="${node.strokeWidth}"`);
  if (node.opacity !== undefined) attrs.push(`opacity="${node.opacity}"`);
  return `<path ${attrs.join(" ")} />`;
}

function serializeText(node: SvgTextNode): string {
  const attrs: string[] = [
    `x="${node.x}"`,
    `y="${node.y}"`,
    `font-family="${escapeXmlAttr(node.fontFamily)}"`,
    `font-size="${node.fontSize}"`,
    `font-weight="${node.fontWeight}"`,
    `font-style="${node.fontStyle}"`,
    `letter-spacing="${node.letterSpacing}"`,
    `fill="${escapeXmlAttr(node.fill)}"`,
    `opacity="${node.opacity}"`,
  ];
  return `<text ${attrs.join(" ")}>${escapeXmlText(node.text)}</text>`;
}

function serializeImage(node: SvgImageNode): string {
  const attrs: string[] = [
    `x="${node.x}"`,
    `y="${node.y}"`,
    `width="${node.width}"`,
    `height="${node.height}"`,
    `href="${escapeXmlAttr(node.href)}"`,
    `opacity="${node.opacity}"`,
  ];
  return `<image ${attrs.join(" ")} />`;
}

function serializeLine(node: SvgLineNode): string {
  const attrs: string[] = [
    `x1="${node.x1}"`,
    `y1="${node.y1}"`,
    `x2="${node.x2}"`,
    `y2="${node.y2}"`,
    `stroke="${escapeXmlAttr(node.stroke)}"`,
    `stroke-width="${node.strokeWidth}"`,
  ];
  if (node.opacity !== undefined) attrs.push(`opacity="${node.opacity}"`);
  return `<line ${attrs.join(" ")} />`;
}

function serializeRect(node: SvgRectNode): string {
  const attrs: string[] = [
    `x="${node.x}"`,
    `y="${node.y}"`,
    `width="${node.width}"`,
    `height="${node.height}"`,
  ];
  if (node.stroke !== undefined) attrs.push(`stroke="${escapeXmlAttr(node.stroke)}"`);
  if (node.strokeWidth !== undefined) attrs.push(`stroke-width="${node.strokeWidth}"`);
  if (node.fill !== undefined) attrs.push(`fill="${escapeXmlAttr(node.fill)}"`);
  if (node.opacity !== undefined) attrs.push(`opacity="${node.opacity}"`);
  return `<rect ${attrs.join(" ")} />`;
}

function serializeCircle(node: SvgCircleNode): string {
  const attrs: string[] = [
    `cx="${node.cx}"`,
    `cy="${node.cy}"`,
    `r="${node.r}"`,
    `fill="${escapeXmlAttr(node.fill)}"`,
  ];
  if (node.opacity !== undefined) attrs.push(`opacity="${node.opacity}"`);
  return `<circle ${attrs.join(" ")} />`;
}

function serializeGroup(node: SvgGroupNode): string {
  const attrs: string[] = [];
  if (node.opacity !== undefined) attrs.push(`opacity="${node.opacity}"`);
  const attrStr = attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  const childrenStr = node.children.map(serializeNode).join("\n  ");
  return `<g${attrStr}>\n  ${childrenStr}\n</g>`;
}

function serializeNode(node: SvgNode): string {
  switch (node.kind) {
    case "path":
      return serializePath(node);
    case "text":
      return serializeText(node);
    case "image":
      return serializeImage(node);
    case "line":
      return serializeLine(node);
    case "rect":
      return serializeRect(node);
    case "circle":
      return serializeCircle(node);
    case "group":
      return serializeGroup(node);
  }
}

export function serializeSvg(document: SvgDocument): string {
  const rootAttrs = [
    `xmlns="http://www.w3.org/2000/svg"`,
    `width="${document.width}"`,
    `height="${document.height}"`,
    `viewBox="${document.viewBox}"`,
  ];

  const body = document.children.map(serializeNode).join("\n  ");
  return `<svg ${rootAttrs.join(" ")}>\n  ${body}\n</svg>`;
}
