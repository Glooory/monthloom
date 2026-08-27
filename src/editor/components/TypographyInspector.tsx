import React, { useState, useEffect } from "react";
import type { Typography } from "../../domain/template/primitives";
import type { FontDescriptor } from "../../domain/template/font";

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
      <div className="section-heading">文字排版</div>

      <div className="field-group">
        <div className="field-row">
          <span className="field-label">字体族</span>
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
          <span className="field-label">字重</span>
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
            <option value={300}>300 - 细体 (Light)</option>
            <option value={400}>400 - 常规 (Regular)</option>
            <option value={500}>500 - 中粗 (Medium)</option>
            <option value={600}>600 - 半粗 (SemiBold)</option>
            <option value={700}>700 - 粗体 (Bold)</option>
            <option value={900}>900 - 特粗 (Black)</option>
          </select>
        </div>

        <div className="field-row">
          <span className="field-label">字形样式</span>
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
            <option value="normal">常规 (Normal)</option>
            <option value="italic">斜体 (Italic)</option>
          </select>
        </div>

        <div className="field-row">
          <span className="field-label">字号大小</span>
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
          <span className="field-label">字间距</span>
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
          <span className="field-label">不透明度</span>
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
