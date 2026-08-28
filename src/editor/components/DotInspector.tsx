import React from "react";
import type { DotTemplate } from "../../domain/template/primitives";
import { useI18n } from "../../shared/i18n/i18nStore";
import { NumberInput } from "./NumberInput";

export interface DotInspectorProps {
  dot: DotTemplate;
  onChangeDot: (next: DotTemplate) => void;
}

export const DotInspector: React.FC<DotInspectorProps> = ({ dot, onChangeDot }) => {
  const { t } = useI18n();

  return (
    <div className="inspector-section">
      <div className="section-heading">{t.inspector.dotHeading}</div>

      <div className="field-group">
        <div className="field-row">
          <span className="field-label">{t.inspector.dotSizeLabel}</span>
          <NumberInput
            min={0.5}
            step={0.5}
            value={dot.size}
            onChange={(size) => onChangeDot({ ...dot, size })}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.dotColorLabel}</span>
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
          <span className="field-label">{t.inspector.opacityLabel}</span>
          <NumberInput
            min={0}
            max={1}
            step={0.05}
            value={dot.opacity}
            onChange={(opacity) => onChangeDot({ ...dot, opacity })}
          />
        </div>
      </div>
    </div>
  );
};
