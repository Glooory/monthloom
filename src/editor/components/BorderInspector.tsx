import React from "react";
import { useI18n } from "../../shared/i18n/i18nStore";
import { NumberInput } from "./NumberInput";
import { HexColorInput } from "./HexColorInput";

export interface BorderInspectorProps {
  title?: string;
  borderWidth: number;
  borderColor: string;
  onChangeBorder: (border: { borderWidth: number; borderColor: string }) => void;
}

export const BorderInspector: React.FC<BorderInspectorProps> = ({
  title,
  borderWidth,
  borderColor,
  onChangeBorder,
}) => {
  const { t } = useI18n();

  return (
    <div className="inspector-section">
      <div className="section-heading">{title ?? t.inspector.borderHeading}</div>
      <div className="field-group">
        <div className="field-row">
          <span className="field-label">{t.inspector.borderWidthLabel}</span>
          <NumberInput
            min={0}
            step={0.5}
            value={borderWidth}
            onChange={(nextWidth) => onChangeBorder({ borderWidth: nextWidth, borderColor })}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.borderColorLabel}</span>
          <div className="color-input-container">
            <input
              type="color"
              className="color-picker-input"
              value={borderColor}
              onChange={(e) => onChangeBorder({ borderWidth, borderColor: e.target.value })}
            />
            <HexColorInput
              value={borderColor}
              label={`${title ?? t.inspector.borderHeading}: ${t.inspector.borderColorLabel}`}
              onChange={(color) => onChangeBorder({ borderWidth, borderColor: color })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
