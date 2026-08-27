import React, { useMemo } from "react";
import type { SvgDocument } from "../../rendering/svg/document";
import type { RenderScene } from "../../rendering/scene/types";
import type { EditorSelection, PositionableSemanticId } from "../model/types";
import type { Anchor } from "../../domain/template/primitives";
import { SvgPreview } from "../../rendering/svg/SvgPreview";
import { EditorOverlay } from "./EditorOverlay";
import { buildEditorHitTargets } from "../selection/hitTargets";

export interface EditorCanvasProps {
  svgDocument: SvgDocument | null;
  scene: RenderScene | null;
  selection: EditorSelection | null;
  activeTemplate: "main" | "mini";
  mainWeekdayHeight?: number;
  onSelect: (selection: EditorSelection | null) => void;
  onSelectAnchor: (nextAnchor: Anchor) => void;
  onStartDrag: (
    semanticId: PositionableSemanticId,
    instanceKey: string,
    clientX: number,
    clientY: number,
  ) => void;
  onMoveDrag: (clientX: number, clientY: number, renderedBounds: DOMRect) => void;
  onEndDrag: () => void;
  onCancelDrag: () => void;
  onStartWeekdayResize: (clientY: number) => void;
  onMoveWeekdayResize: (clientY: number, renderedBounds: DOMRect) => void;
  onEndWeekdayResize: () => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  svgDocument,
  scene,
  selection,
  activeTemplate,
  mainWeekdayHeight,
  onSelect,
  onSelectAnchor,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onCancelDrag,
  onStartWeekdayResize,
  onMoveWeekdayResize,
  onEndWeekdayResize,
}) => {
  const targets = useMemo(() => {
    if (!scene) return [];
    return buildEditorHitTargets(scene);
  }, [scene]);

  if (!svgDocument || !scene) {
    return (
      <div className="editor-canvas-container">
        <div style={{ color: "#94a3b8" }}>正在渲染预览...</div>
      </div>
    );
  }

  return (
    <div className="editor-canvas-container">
      <div
        className="canvas-viewport"
        style={{
          width: scene.width,
          height: scene.height,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        <SvgPreview document={svgDocument} />
        <EditorOverlay
          scene={scene}
          targets={targets}
          selection={selection}
          activeTemplate={activeTemplate}
          mainWeekdayHeight={mainWeekdayHeight}
          onSelect={onSelect}
          onSelectAnchor={(_, nextAnchor) => onSelectAnchor(nextAnchor)}
          onStartDrag={onStartDrag}
          onMoveDrag={onMoveDrag}
          onEndDrag={onEndDrag}
          onCancelDrag={onCancelDrag}
          onStartWeekdayResize={onStartWeekdayResize}
          onMoveWeekdayResize={onMoveWeekdayResize}
          onEndWeekdayResize={onEndWeekdayResize}
        />
      </div>
    </div>
  );
};
