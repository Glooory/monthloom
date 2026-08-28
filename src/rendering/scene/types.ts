import type { Position, Typography } from "../../domain/template/primitives";

export type SemanticElementId =
  | "main.weekday"
  | "main.date"
  | "main.grid"
  | "mini.monthLabel"
  | "mini.weekday"
  | "mini.date"
  | (string & {});

export type Rect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type SceneTextNode = Readonly<{
  kind: "text";
  semanticId: SemanticElementId;
  instanceKey?: string;
  text: string;

  originX: number;
  baselineY: number;
  metrics: Readonly<{
    width: number;
    ascent: number;
    descent: number;
  }>;

  // Retained semantic positioning context for the later Editor.
  cell: Rect;
  position: Position;

  typography: Typography;
  color: string;
  opacity: number;
}>;

export type SceneImageNode = Readonly<{
  kind: "image";
  semanticId: SemanticElementId;
  instanceKey?: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  cell?: Rect;
  position?: Position;
}>;

export type SceneDotNode = Readonly<{
  kind: "dot";
  semanticId: SemanticElementId;
  instanceKey?: string;
  cx: number;
  cy: number;
  radius: number;
  color: string;
  opacity: number;
  cell?: Rect;
  position?: Position;
}>;

export type SceneLineNode = Readonly<{
  kind: "line";
  semanticId: SemanticElementId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}>;

export type SceneRectNode = Readonly<{
  kind: "rect";
  semanticId: SemanticElementId;
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}>;

export type RenderNode =
  | SceneTextNode
  | SceneImageNode
  | SceneDotNode
  | SceneLineNode
  | SceneRectNode;

export type RenderScene = Readonly<{
  width: number;
  height: number;
  nodes: readonly RenderNode[];
}>;
