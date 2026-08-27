import type { AssetResolver } from "../../resources/assets/types";
import { binaryAssetToDataUri } from "../../resources/assets/dataUri";
import type { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";
import type {
  RenderNode,
  RenderScene,
  SceneDotNode,
  SceneImageNode,
  SceneLineNode,
  SceneRectNode,
  SceneTextNode,
} from "../scene/types";
import type { SvgNode } from "./ast";
import { createSvgDocument, type SvgDocument } from "./document";

export type SvgTextMode = "outlined" | "editable";

function materializeLine(node: SceneLineNode): SvgNode {
  return {
    kind: "line",
    x1: node.x1,
    y1: node.y1,
    x2: node.x2,
    y2: node.y2,
    stroke: node.stroke,
    strokeWidth: node.strokeWidth,
  };
}

function materializeRect(node: SceneRectNode): SvgNode {
  return {
    kind: "rect",
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    stroke: node.stroke,
    strokeWidth: node.strokeWidth,
    fill: node.fill ?? "none",
  };
}

function materializeDot(node: SceneDotNode): SvgNode {
  return {
    kind: "circle",
    cx: node.cx,
    cy: node.cy,
    r: node.radius,
    fill: node.color,
    opacity: node.opacity,
  };
}

async function materializeImage(
  node: SceneImageNode,
  assetResolver: AssetResolver,
): Promise<SvgNode> {
  const asset = await assetResolver.resolve(node.assetId);
  const href = binaryAssetToDataUri(asset);
  return {
    kind: "image",
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    href,
    opacity: node.opacity,
  };
}

function materializeText(
  node: SceneTextNode,
  mode: SvgTextMode,
  fontEngine: ResolvedFontEngine,
): readonly SvgNode[] {
  if (mode === "outlined") {
    const glyphPaths = fontEngine.outline({
      text: node.text,
      typography: node.typography,
      originX: node.originX,
      baselineY: node.baselineY,
    });

    return glyphPaths.map((p) => ({
      kind: "path" as const,
      d: p.d,
      transform: p.transform,
      fill: node.color,
      opacity: node.opacity,
    }));
  }

  // Editable mode: emit <text> node using resolved coordinates
  const descriptor = fontEngine.getDescriptor(node.typography.fontId);
  return [
    {
      kind: "text" as const,
      x: node.originX,
      y: node.baselineY,
      text: node.text,
      fontFamily: descriptor.family,
      fontSize: node.typography.fontSize,
      fontWeight: node.typography.fontWeight,
      fontStyle: node.typography.fontStyle,
      letterSpacing: node.typography.letterSpacing,
      fill: node.color,
      opacity: node.opacity,
    },
  ];
}

async function materializeNode(
  node: RenderNode,
  mode: SvgTextMode,
  fontEngine: ResolvedFontEngine,
  assetResolver: AssetResolver,
): Promise<readonly SvgNode[]> {
  switch (node.kind) {
    case "line":
      return [materializeLine(node)];
    case "rect":
      return [materializeRect(node)];
    case "dot":
      return [materializeDot(node)];
    case "image":
      return [await materializeImage(node, assetResolver)];
    case "text":
      return materializeText(node, mode, fontEngine);
  }
}

export async function materializeSvg(args: {
  scene: RenderScene;
  mode: SvgTextMode;
  fontEngine: ResolvedFontEngine;
  assetResolver: AssetResolver;
}): Promise<SvgDocument> {
  const { scene, mode, fontEngine, assetResolver } = args;

  const children: SvgNode[] = [];
  for (const node of scene.nodes) {
    const materialized = await materializeNode(node, mode, fontEngine, assetResolver);
    children.push(...materialized);
  }

  return createSvgDocument(scene.width, scene.height, children);
}
