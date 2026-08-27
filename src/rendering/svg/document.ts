import type { SvgNode } from "./ast";

export type SvgDocument = Readonly<{
  width: number;
  height: number;
  viewBox: string;
  children: readonly SvgNode[];
}>;

export function createSvgDocument(
  width: number,
  height: number,
  children: readonly SvgNode[],
): SvgDocument {
  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    children,
  };
}
