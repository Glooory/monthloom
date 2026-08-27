export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type Position = Readonly<{
  anchor: Anchor;
  offsetX: number;
  offsetY: number;
}>;

export type Typography = Readonly<{
  fontId: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  letterSpacing: number;
  color: string;
  opacity: number;
}>;

export type TextElementTemplate = Readonly<{
  position: Position;
  typography: Typography;
}>;

export type TextMarkerTemplate = Readonly<{
  type: "text";
  value: string;
  position: Position;
  typography: Typography;
}>;

export type ImageMarkerTemplate = Readonly<{
  type: "image";
  assetId: string;
  position: Position;
  width: number;
  height: number;
  opacity: number;
}>;

export type MarkerTemplate = TextMarkerTemplate | ImageMarkerTemplate;

export type DotTemplate = Readonly<{
  position: Position;
  size: number;
  color: string;
  opacity: number;
}>;
