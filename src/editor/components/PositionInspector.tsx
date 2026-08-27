import React, { useState, useEffect } from "react";
import type { Position, Anchor } from "../../domain/template/primitives";

const ANCHOR_GRID: readonly Anchor[][] = [
  ["top-left", "top-center", "top-right"],
  ["center-left", "center", "center-right"],
  ["bottom-left", "bottom-center", "bottom-right"],
];

export interface PositionInspectorProps {
  position: Position;
  onChange: (next: Position) => void;
  onAnchorChange?: (nextAnchor: Anchor) => void;
}

const ANCHOR_NAMES: Record<Anchor, string> = {
  "top-left": "左上",
  "top-center": "中上",
  "top-right": "右上",
  "center-left": "左中",
  "center": "居中",
  "center-right": "右中",
  "bottom-left": "左下",
  "bottom-center": "中下",
  "bottom-right": "右下",
};

export const PositionInspector: React.FC<PositionInspectorProps> = ({
  position,
  onChange,
  onAnchorChange,
}) => {
  const [draftX, setDraftX] = useState(String(position.offsetX));
  const [draftY, setDraftY] = useState(String(position.offsetY));

  useEffect(() => {
    setDraftX(String(position.offsetX));
    setDraftY(String(position.offsetY));
  }, [position.offsetX, position.offsetY]);

  const commitX = () => {
    const val = parseFloat(draftX);
    if (!isNaN(val) && val !== position.offsetX) {
      onChange({ ...position, offsetX: val });
    } else {
      setDraftX(String(position.offsetX));
    }
  };

  const commitY = () => {
    const val = parseFloat(draftY);
    if (!isNaN(val) && val !== position.offsetY) {
      onChange({ ...position, offsetY: val });
    } else {
      setDraftY(String(position.offsetY));
    }
  };

  const handleKeyDownX = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitX();
    } else if (e.key === "Escape") {
      setDraftX(String(position.offsetX));
    }
  };

  const handleKeyDownY = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitY();
    } else if (e.key === "Escape") {
      setDraftY(String(position.offsetY));
    }
  };

  return (
    <div className="inspector-section">
      <div className="section-heading">位置对齐</div>
      <div className="field-row" style={{ marginBottom: 12 }}>
        <span className="field-label">对齐锚点</span>
        <div className="anchor-grid">
          {ANCHOR_GRID.map((row) =>
            row.map((anchor) => (
              <button
                key={anchor}
                type="button"
                className={`anchor-grid-btn ${position.anchor === anchor ? "active" : ""}`}
                title={ANCHOR_NAMES[anchor]}
                onClick={() => {
                  if (onAnchorChange) {
                    onAnchorChange(anchor);
                  } else {
                    onChange({ ...position, anchor });
                  }
                }}
              />
            )),
          )}
        </div>
      </div>

      <div className="field-row">
        <span className="field-label">水平偏移 X</span>
        <input
          type="number"
          className="field-input field-input-number"
          value={draftX}
          onChange={(e) => setDraftX(e.target.value)}
          onBlur={commitX}
          onKeyDown={handleKeyDownX}
        />
      </div>

      <div className="field-row" style={{ marginTop: 8 }}>
        <span className="field-label">垂直偏移 Y</span>
        <input
          type="number"
          className="field-input field-input-number"
          value={draftY}
          onChange={(e) => setDraftY(e.target.value)}
          onBlur={commitY}
          onKeyDown={handleKeyDownY}
        />
      </div>
    </div>
  );
};
