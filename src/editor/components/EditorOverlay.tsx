import React, { useRef } from "react";
import type { RenderScene } from "../../rendering/scene/types";
import type { EditorHitTarget } from "../selection/hitTargets";
import type { EditorSelection, PositionableSemanticId } from "../model/types";
import type { Anchor } from "../../domain/template/primitives";
import { AnchorOverlay } from "./AnchorOverlay";
import { getInteractiveHitBounds } from "../selection/hitTargets";
import { resolveSelectedTarget } from "../selection/selection";

export interface EditorOverlayProps {
  scene: RenderScene;
  targets: readonly EditorHitTarget[];
  selection: EditorSelection | null;
  activeTemplate: "main" | "mini";
  onSelect: (selection: EditorSelection | null) => void;
  onSelectAnchor: (target: EditorHitTarget, nextAnchor: Anchor) => void;
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

export const EditorOverlay: React.FC<EditorOverlayProps> = ({
  scene,
  targets,
  selection,
  onSelect,
  onSelectAnchor,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onCancelDrag,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef(false);

  const selectedTarget = resolveSelectedTarget(targets, selection);

  const handlePointerDownTarget = (
    e: React.PointerEvent<SVGRectElement>,
    target: EditorHitTarget,
  ) => {
    e.stopPropagation();
    onSelect({
      semanticId: target.semanticId,
      instanceKey: target.instanceKey,
    });

    isDraggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    onStartDrag(target.semanticId, target.instanceKey, e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    if (isDraggingRef.current) {
      onMoveDrag(e.clientX, e.clientY, rect);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // pointer capture might already be released
      }
      onEndDrag();
    }
  };

  const handlePointerCancel = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      onCancelDrag();
    }
  };

  return (
    <svg
      ref={svgRef}
      className="editor-overlay"
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={() => {
        // Clicking empty overlay clears selection
        onSelect(null);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* 1. Hit targets for selection & drag */}
      {targets.map((target) => {
        const hit = getInteractiveHitBounds(target.bounds);
        return (
          <rect
            key={target.instanceKey}
            className="hit-target"
            x={hit.x}
            y={hit.y}
            width={hit.width}
            height={hit.height}
            onPointerDown={(e) => handlePointerDownTarget(e, target)}
          />
        );
      })}

      {/* 2. Selection highlight */}
      {selectedTarget && (
        <rect
          className="selection-highlight"
          x={selectedTarget.bounds.x - 2}
          y={selectedTarget.bounds.y - 2}
          width={selectedTarget.bounds.width + 4}
          height={selectedTarget.bounds.height + 4}
          rx={2}
        />
      )}

      {/* 3. Anchor visualization overlay */}
      {selectedTarget && (
        <AnchorOverlay
          cell={selectedTarget.cell}
          currentAnchor={selectedTarget.position.anchor}
          onSelectAnchor={(nextAnchor) => onSelectAnchor(selectedTarget, nextAnchor)}
        />
      )}
    </svg>
  );
};
