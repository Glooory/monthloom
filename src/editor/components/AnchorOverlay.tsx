import React from "react";
import type { Rect } from "../../rendering/scene/types";
import type { Anchor } from "../../domain/template/primitives";
import { getAnchorPoint } from "../../rendering/layout/anchors";

const ALL_ANCHORS: readonly Anchor[] = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export interface AnchorOverlayProps {
  cell: Rect;
  currentAnchor: Anchor;
  onSelectAnchor: (nextAnchor: Anchor) => void;
}

export const AnchorOverlay: React.FC<AnchorOverlayProps> = ({
  cell,
  currentAnchor,
  onSelectAnchor,
}) => {
  return (
    <g className="anchor-overlay-group">
      {/* Cell boundary preview */}
      <rect
        x={cell.x}
        y={cell.y}
        width={cell.width}
        height={cell.height}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1}
        strokeDasharray="2 2"
        opacity={0.4}
        pointerEvents="none"
      />

      {/* Nine anchor points */}
      {ALL_ANCHORS.map((anchor) => {
        const pt = getAnchorPoint(cell, anchor);
        const isActive = anchor === currentAnchor;

        return (
          <g
            key={anchor}
            className={`anchor-point ${isActive ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectAnchor(anchor);
            }}
          >
            {/* Expanded hit area */}
            <circle cx={pt.x} cy={pt.y} r={8} fill="transparent" />
            {/* Visual anchor point */}
            <circle className="anchor-visual" cx={pt.x} cy={pt.y} r={isActive ? 4 : 3} />
          </g>
        );
      })}
    </g>
  );
};
