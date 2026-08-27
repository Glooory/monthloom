export type SvgAttributes = {
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type SvgGroup = {
  kind: "group";
  opacity?: number;
  children: SvgNode[];
};

export type SvgPath = SvgAttributes & {
  kind: "path";
  d: string;
  transform?: string;
};

export type SvgLine = SvgAttributes & {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type SvgRect = SvgAttributes & {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SvgImage = {
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  opacity?: number;
};

export type SvgNode = SvgGroup | SvgPath | SvgLine | SvgRect | SvgImage;

export type SvgDocument = {
  width: number;
  height: number;
  viewBox: string;
  children: SvgNode[];
};
