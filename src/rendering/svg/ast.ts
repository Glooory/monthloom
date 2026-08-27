export type SvgPathNode = Readonly<{
  kind: "path";
  d: string;
  transform?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}>;

export type SvgTextNode = Readonly<{
  kind: "text";
  x: number;
  y: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  letterSpacing: number;
  fill: string;
  opacity: number;
}>;

export type SvgImageNode = Readonly<{
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  opacity: number;
}>;

export type SvgLineNode = Readonly<{
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  opacity?: number;
}>;

export type SvgRectNode = Readonly<{
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
}>;

export type SvgCircleNode = Readonly<{
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity?: number;
}>;

export type SvgGroupNode = Readonly<{
  kind: "group";
  opacity?: number;
  children: readonly SvgNode[];
}>;

export type SvgNode =
  | SvgPathNode
  | SvgTextNode
  | SvgImageNode
  | SvgLineNode
  | SvgRectNode
  | SvgCircleNode
  | SvgGroupNode;
