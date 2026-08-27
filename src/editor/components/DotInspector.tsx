import React, { useState, useEffect } from "react";
import type { DotTemplate } from "../../domain/template/primitives";

export interface DotInspectorProps {
  dot: DotTemplate;
  onChangeDot: (next: DotTemplate) => void;
}

export const DotInspector: React.FC<DotInspectorProps> = ({ dot, onChangeDot }) => {
  const [draftSize, setDraftSize] = useState(String(dot.size));
  const [draftOpacity, setDraftOpacity] = useState(String(dot.opacity));

  useEffect(() => {
    setDraftSize(String(dot.size));
    setDraftOpacity(String(dot.opacity));
  }, [dot.size, dot.opacity]);

  return (
    <div className="inspector-section">
      <div className="section-heading">圆点标记</div>

      <div className="field-group">
        <div className="field-row">
          <span className="field-label">尺寸 (直径)</span>
          <input
            type="number"
            min="1"
            className="field-input field-input-number"
            value={draftSize}
            onChange={(e) => setDraftSize(e.target.value)}
            onBlur={() => {
              const val = parseFloat(draftSize);
              if (!isNaN(val) && val > 0 && val !== dot.size) {
                onChangeDot({ ...dot, size: val });
              }
            }}
          />
        </div>

        <div className="field-row">
          <span className="field-label">圆点颜色</span>
          <div className="color-input-container">
            <input
              type="color"
              className="color-picker-input"
              value={dot.color}
              onChange={(e) => onChangeDot({ ...dot, color: e.target.value })}
            />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{dot.color}</span>
          </div>
        </div>

        <div className="field-row">
          <span className="field-label">不透明度</span>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            className="field-input field-input-number"
            value={draftOpacity}
            onChange={(e) => setDraftOpacity(e.target.value)}
            onBlur={() => {
              const val = parseFloat(draftOpacity);
              if (!isNaN(val) && val >= 0 && val <= 1 && val !== dot.opacity) {
                onChangeDot({ ...dot, opacity: val });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
