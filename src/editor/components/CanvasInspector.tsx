import React from "react";
import type { EditorDocument } from "../model/types";
import {
  getTemplateDimensions,
  setTemplateDimensions,
} from "../model/templateBindings";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import { useI18n } from "../../shared/i18n/i18nStore";
import { NumberInput } from "./NumberInput";

export interface CanvasInspectorProps {
  document: EditorDocument;
  activeTemplate: "main" | "mini";
  onCommitDocument: (next: EditorDocument) => void;
}

interface DimensionPreset {
  label: string;
  width: number;
  height: number;
}

const MAIN_PRESETS: DimensionPreset[] = [
  { label: "700 × 500 (7:5 默认)", width: 700, height: 500 },
  { label: "800 × 600 (4:3 标准)", width: 800, height: 600 },
  { label: "800 × 450 (16:9 宽屏)", width: 800, height: 450 },
  { label: "600 × 600 (1:1 方形)", width: 600, height: 600 },
  { label: "600 × 800 (3:4 竖版)", width: 600, height: 800 },
];

const MINI_PRESETS: DimensionPreset[] = [
  { label: "280 × 210 (4:3 默认)", width: 280, height: 210 },
  { label: "300 × 200 (3:2 标准)", width: 300, height: 200 },
  { label: "320 × 180 (16:9 宽屏)", width: 320, height: 180 },
  { label: "240 × 240 (1:1 方形)", width: 240, height: 240 },
  { label: "200 × 260 (竖版小卡)", width: 200, height: 260 },
];

export const CanvasInspector: React.FC<CanvasInspectorProps> = ({
  document,
  activeTemplate,
  onCommitDocument,
}) => {
  const { t } = useI18n();
  const dimensions = getTemplateDimensions(document, activeTemplate);

  const presets = activeTemplate === "main" ? MAIN_PRESETS : MINI_PRESETS;
  const defaultSize =
    activeTemplate === "main"
      ? { width: DEFAULT_MAIN_TEMPLATE.width, height: DEFAULT_MAIN_TEMPLATE.height }
      : { width: DEFAULT_MINI_TEMPLATE.width, height: DEFAULT_MINI_TEMPLATE.height };

  const isDefault =
    dimensions.width === defaultSize.width && dimensions.height === defaultSize.height;

  const handleWidthChange = (width: number) => {
    const next = setTemplateDimensions(document, activeTemplate, { width });
    onCommitDocument(next);
  };

  const handleHeightChange = (height: number) => {
    const next = setTemplateDimensions(document, activeTemplate, { height });
    onCommitDocument(next);
  };

  const handleApplyPreset = (preset: DimensionPreset) => {
    const next = setTemplateDimensions(document, activeTemplate, {
      width: preset.width,
      height: preset.height,
    });
    onCommitDocument(next);
  };

  const handleResetDefault = () => {
    const next = setTemplateDimensions(document, activeTemplate, {
      width: defaultSize.width,
      height: defaultSize.height,
    });
    onCommitDocument(next);
  };

  const ratio = (dimensions.width / dimensions.height).toFixed(2);

  return (
    <div className="canvas-inspector">
      {/* Header */}
      <div className="inspector-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <div>
            <div className="inspector-title">{t.inspector.canvasHeading}</div>
            <div className="inspector-subtitle">
              {activeTemplate === "main" ? t.layers.mainBadge : t.layers.miniBadge} • {t.inspector.canvasBadge}
            </div>
          </div>
        </div>
      </div>

      {/* Dimensions Inputs Section */}
      <div className="inspector-section">
        <div className="section-heading">{t.inspector.canvasHeading}</div>
        <div className="field-group">
          <div className="field-row">
            <span className="field-label">{t.inspector.canvasWidthLabel}</span>
            <NumberInput
              value={dimensions.width}
              min={100}
              max={4000}
              step={10}
              onChange={handleWidthChange}
            />
          </div>

          <div className="field-row">
            <span className="field-label">{t.inspector.canvasHeightLabel}</span>
            <NumberInput
              value={dimensions.height}
              min={100}
              max={4000}
              step={10}
              onChange={handleHeightChange}
            />
          </div>

          <div className="field-row" style={{ marginTop: "4px" }}>
            <span className="field-label">{t.inspector.aspectRatioLabel}</span>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                fontFamily: "monospace",
                fontWeight: 600,
                background: "var(--bg-input)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {dimensions.width} : {dimensions.height} ({ratio})
            </div>
          </div>
        </div>
      </div>

      {/* Presets Section */}
      <div className="inspector-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div className="section-heading" style={{ margin: 0 }}>{t.inspector.presetsLabel}</div>
          {!isDefault && (
            <button
              type="button"
              className="studio-btn studio-btn-secondary"
              style={{ fontSize: "11px", padding: "2px 8px", height: "auto" }}
              onClick={handleResetDefault}
            >
              {t.inspector.resetDefaultSize}
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px" }}>
          {presets.map((preset) => {
            const isSelected =
              dimensions.width === preset.width && dimensions.height === preset.height;
            return (
              <button
                key={preset.label}
                type="button"
                className={`canvas-preset-btn ${isSelected ? "active" : ""}`}
                onClick={() => handleApplyPreset(preset)}
              >
                <span>{preset.label}</span>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Helpful Hint */}
      <div
        style={{
          margin: "12px 16px",
          padding: "10px 12px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-subtle)",
          fontSize: "11px",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        💡 {t.inspector.canvasHelpHint}
      </div>
    </div>
  );
};
