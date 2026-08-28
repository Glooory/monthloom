import React from "react";
import type { Position, Anchor } from "../../domain/template/primitives";
import { useI18n } from "../../shared/i18n/i18nStore";
import { NumberInput } from "./NumberInput";

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

export const PositionInspector: React.FC<PositionInspectorProps> = ({
  position,
  onChange,
  onAnchorChange,
}) => {
  const { t } = useI18n();

  return (
    <div className="inspector-section">
      <div className="section-heading">{t.inspector.positionHeading}</div>
      <div className="field-row" style={{ marginBottom: 12 }}>
        <span className="field-label">{t.inspector.anchorLabel}</span>
        <div className="anchor-grid">
          {ANCHOR_GRID.map((row) =>
            row.map((anchor) => (
              <button
                key={anchor}
                type="button"
                className={`anchor-grid-btn ${position.anchor === anchor ? "active" : ""}`}
                title={t.inspector.anchors[anchor] ?? anchor}
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
        <span className="field-label">{t.inspector.offsetXLabel}</span>
        <NumberInput
          value={position.offsetX}
          onChange={(offsetX) => onChange({ ...position, offsetX })}
        />
      </div>

      <div className="field-row" style={{ marginTop: 8 }}>
        <span className="field-label">{t.inspector.offsetYLabel}</span>
        <NumberInput
          value={position.offsetY}
          onChange={(offsetY) => onChange({ ...position, offsetY })}
        />
      </div>
    </div>
  );
};
