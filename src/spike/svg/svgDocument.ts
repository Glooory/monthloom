import type { SvgDocument, SvgNode } from "./ast";

export function createSvgDocument(
  width: number,
  height: number,
  children: SvgNode[],
): SvgDocument {
  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    children,
  };
}
