import React, { useState, useEffect } from "react";
import type { Typography } from "../../domain/template/primitives";
import type { FontDescriptor } from "../../domain/template/font";
import { useI18n } from "../../shared/i18n/i18nStore";

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
  const [draftSize, setDraftSize] = useState(String(typography.fontSize));
  const [draftLetterSpacing, setDraftLetterSpacing] = useState(String(typography.letterSpacing));
  const [draftOpacity, setDraftOpacity] = useState(String(typography.opacity));

  useEffect(() => {
    setDraftFamily(currentFamily);
  }, [currentFamily]);

  useEffect(() => {
    setDraftSize(String(typography.fontSize));
    setDraftLetterSpacing(String(typography.letterSpacing));
    setDraftOpacity(String(typography.opacity));
  }, [typography.fontSize, typography.letterSpacing, typography.opacity]);

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

  const commitSize = () => {
    const val = parseFloat(draftSize);
    if (!isNaN(val) && val > 0 && val !== typography.fontSize) {
      onChangeTypography({ ...typography, fontSize: val });
    } else {
      setDraftSize(String(typography.fontSize));
    }
  };

  const commitLetterSpacing = () => {
    const val = parseFloat(draftLetterSpacing);
    if (!isNaN(val) && val !== typography.letterSpacing) {
      onChangeTypography({ ...typography, letterSpacing: val });
    } else {
      setDraftLetterSpacing(String(typography.letterSpacing));
    }
  };

  const commitOpacity = () => {
    const val = parseFloat(draftOpacity);
    if (!isNaN(val) && val >= 0 && val <= 1 && val !== typography.opacity) {
      onChangeTypography({ ...typography, opacity: val });
    } else {
      setDraftOpacity(String(typography.opacity));
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
          <input
            type="number"
            className="field-input field-input-number"
            value={draftSize}
            onChange={(e) => setDraftSize(e.target.value)}
            onBlur={commitSize}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSize();
              if (e.key === "Escape") setDraftSize(String(typography.fontSize));
            }}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.letterSpacingLabel}</span>
          <input
            type="number"
            className="field-input field-input-number"
            value={draftLetterSpacing}
            onChange={(e) => setDraftLetterSpacing(e.target.value)}
            onBlur={commitLetterSpacing}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitLetterSpacing();
              if (e.key === "Escape") setDraftLetterSpacing(String(typography.letterSpacing));
            }}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.opacityLabel}</span>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            className="field-input field-input-number"
            value={draftOpacity}
            onChange={(e) => setDraftOpacity(e.target.value)}
            onBlur={commitOpacity}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitOpacity();
              if (e.key === "Escape") setDraftOpacity(String(typography.opacity));
            }}
          />
        </div>
      </div>
    </div>
  );
};
