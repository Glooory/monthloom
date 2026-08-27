import React, { useState, useEffect } from "react";

export interface BorderInspectorProps {
  borderWidth: number;
  borderColor: string;
  onChangeBorder: (border: { borderWidth: number; borderColor: string }) => void;
}

export const BorderInspector: React.FC<BorderInspectorProps> = ({
  borderWidth,
  borderColor,
  onChangeBorder,
}) => {
  const [draftWidth, setDraftWidth] = useState(String(borderWidth));

  useEffect(() => {
    setDraftWidth(String(borderWidth));
  }, [borderWidth]);

  const commitWidth = () => {
    const val = parseFloat(draftWidth);
    if (!isNaN(val) && val >= 0 && val !== borderWidth) {
      onChangeBorder({ borderWidth: val, borderColor });
    } else {
      setDraftWidth(String(borderWidth));
    }
  };

  return (
    <div className="inspector-section">
      <div className="section-heading">网格边框</div>
      <div className="field-group">
        <div className="field-row">
          <span className="field-label">边框粗细</span>
          <input
            type="number"
            min="0"
            className="field-input field-input-number"
            value={draftWidth}
            onChange={(e) => setDraftWidth(e.target.value)}
            onBlur={commitWidth}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitWidth();
              if (e.key === "Escape") setDraftWidth(String(borderWidth));
            }}
          />
        </div>

        <div className="field-row">
          <span className="field-label">边框颜色</span>
          <div className="color-input-container">
            <input
              type="color"
              className="color-picker-input"
              value={borderColor}
              onChange={(e) => onChangeBorder({ borderWidth, borderColor: e.target.value })}
            />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{borderColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
