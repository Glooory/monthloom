import React, { useState, useEffect } from "react";
import type { Typography } from "../../domain/template/primitives";
import type { FontDescriptor } from "../../domain/template/font";
import { useI18n } from "../../shared/i18n/i18nStore";
import { NumberInput } from "./NumberInput";

export interface TypographyInspectorProps {
  typography: Typography;
  fontDescriptor?: FontDescriptor;
  onChangeTypography: (next: Typography) => void;
  onChangeFontDescriptor?: (next: FontDescriptor) => void;
}

export const TypographyInspector: React.FC<TypographyInspectorProps> = ({
  typography,
  fontDescriptor,
  onChangeTypography,
  onChangeFontDescriptor,
}) => {
  const { t } = useI18n();
  const currentFamily = fontDescriptor?.family ?? "Noto Sans";
  const [draftFamily, setDraftFamily] = useState(currentFamily);

  useEffect(() => {
    setDraftFamily(currentFamily);
  }, [currentFamily]);

  const commitFamily = () => {
    const trimmed = draftFamily.trim();
    if (trimmed && trimmed !== currentFamily && fontDescriptor && onChangeFontDescriptor) {
      onChangeFontDescriptor({
        ...fontDescriptor,
        family: trimmed,
        source: { type: "google", family: trimmed },
      });
    } else {
      setDraftFamily(currentFamily);
    }
  };

  return (
    <div className="inspector-section">
      <div className="section-heading">{t.inspector.typographyHeading}</div>

      <div className="field-group">
        <div className="field-row">
          <span className="field-label">{t.inspector.fontFamilyLabel}</span>
          <input
            type="text"
            className="field-input"
            value={draftFamily}
            onChange={(e) => setDraftFamily(e.target.value)}
            onBlur={commitFamily}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitFamily();
              if (e.key === "Escape") setDraftFamily(currentFamily);
            }}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.fontWeightLabel}</span>
          <select
            className="field-input"
            value={typography.fontWeight}
            onChange={(e) => {
              const weight = parseInt(e.target.value, 10);
              onChangeTypography({ ...typography, fontWeight: weight });
              if (fontDescriptor && onChangeFontDescriptor) {
                onChangeFontDescriptor({ ...fontDescriptor, weight });
              }
            }}
          >
            <option value={300}>{t.inspector.fontWeights.light}</option>
            <option value={400}>{t.inspector.fontWeights.regular}</option>
            <option value={500}>{t.inspector.fontWeights.medium}</option>
            <option value={600}>{t.inspector.fontWeights.semiBold}</option>
            <option value={700}>{t.inspector.fontWeights.bold}</option>
            <option value={900}>{t.inspector.fontWeights.black}</option>
          </select>
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.fontStyleLabel}</span>
          <select
            className="field-input"
            value={typography.fontStyle}
            onChange={(e) => {
              const style = e.target.value as "normal" | "italic";
              onChangeTypography({ ...typography, fontStyle: style });
              if (fontDescriptor && onChangeFontDescriptor) {
                onChangeFontDescriptor({ ...fontDescriptor, style });
              }
            }}
          >
            <option value="normal">{t.inspector.fontStyles.normal}</option>
            <option value="italic">{t.inspector.fontStyles.italic}</option>
          </select>
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.fontSizeLabel}</span>
          <NumberInput
            min={1}
            step={1}
            value={typography.fontSize}
            onChange={(fontSize) => onChangeTypography({ ...typography, fontSize })}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.letterSpacingLabel}</span>
          <NumberInput
            step={0.5}
            value={typography.letterSpacing}
            onChange={(letterSpacing) => onChangeTypography({ ...typography, letterSpacing })}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.opacityLabel}</span>
          <NumberInput
            min={0}
            max={1}
            step={0.05}
            value={typography.opacity}
            onChange={(opacity) => onChangeTypography({ ...typography, opacity })}
          />
        </div>
      </div>
    </div>
  );
};
