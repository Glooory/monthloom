import React, { useMemo, useRef, useEffect } from "react";
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
  zoom?: number;
  onZoomChange?: React.Dispatch<React.SetStateAction<number>> | ((updater: (prev: number) => number) => void);
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
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  svgDocument,
  scene,
  selection,
  activeTemplate,
  zoom = 1,
  onZoomChange,
  onSelect,
  onSelectAnchor,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onCancelDrag,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const targets = useMemo(() => {
    if (!scene) return [];
    return buildEditorHitTargets(scene);
  }, [scene]);

  // Figma-like wheel & pinch zoom handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onZoomChange) return;

    const handleWheel = (e: WheelEvent) => {
      // Figma standard: Pinch on trackpad (e.ctrlKey) or Ctrl/Cmd + Wheel zooms
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.003);
        onZoomChange((prevZoom) => {
          const next = Math.min(4.0, Math.max(0.25, prevZoom * factor));
          return Math.round(next * 100) / 100;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [onZoomChange]);

  if (!svgDocument || !scene) {
    return (
      <div className="editor-canvas-container">
        <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>正在渲染预览...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="editor-canvas-container"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      <div
        className="canvas-viewport-wrapper"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            onSelect(null);
          }
        }}
      >
        <div
          className="canvas-artboard"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              onSelect(null);
            }
          }}
        >
          <div
            className="canvas-viewport"
            style={{
              width: scene.width,
              height: scene.height,
            }}
          >
            <SvgPreview document={svgDocument} />
            <EditorOverlay
              scene={scene}
              targets={targets}
              selection={selection}
              activeTemplate={activeTemplate}
              onSelect={onSelect}
              onSelectAnchor={(_, nextAnchor) => onSelectAnchor(nextAnchor)}
              onStartDrag={onStartDrag}
              onMoveDrag={onMoveDrag}
              onEndDrag={onEndDrag}
              onCancelDrag={onCancelDrag}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
