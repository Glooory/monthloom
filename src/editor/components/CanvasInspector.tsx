import React from "react";
import type { EditorDocument } from "../model/types";
import {
  getTemplateDimensions,
  setTemplateDimensions,
  getGridBorder,
  setGridBorder,
  getWeekdayRowSettings,
  setWeekdayRowSettings,
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
  const weekdaySettings = getWeekdayRowSettings(document, activeTemplate);
  const gridBorder = activeTemplate === "main" ? getGridBorder(document) : null;

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

  const handleGridBorderChange = (updates: {
    showBorder?: boolean;
    borderWidth?: number;
    borderColor?: string;
  }) => {
    const next = setGridBorder(document, updates);
    onCommitDocument(next);
  };

  const handleWeekdayBorderChange = (updates: {
    showBorder?: boolean;
    borderWidth?: number;
    borderColor?: string;
  }) => {
    const next = setWeekdayRowSettings(document, activeTemplate, updates);
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

      {/* 1. Canvas Sizing & Presets Section */}
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

        {/* Presets Grid */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="field-label" style={{ fontWeight: 600 }}>{t.inspector.presetsLabel}</span>
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
      </div>

      {/* 2. Grid & Border System Section */}
      <div className="inspector-section">
        <div className="section-heading">{t.inspector.gridSystemHeading}</div>

        {/* Date Grid Lines (Main only) */}
        {activeTemplate === "main" && gridBorder && (
          <div className="field-group" style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              {t.inspector.dateGridLinesLabel}
            </div>
            <div className="field-row">
              <span className="field-label">{t.inspector.showDateGridBorderLabel}</span>
              <input
                type="checkbox"
                checked={gridBorder.showBorder ?? true}
                onChange={(e) => handleGridBorderChange({ showBorder: e.target.checked })}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent-primary)" }}
              />
            </div>

            {(gridBorder.showBorder ?? true) && (
              <div className="weekday-border-options" style={{ marginTop: "6px" }}>
                <div className="field-row">
                  <span className="field-label">{t.inspector.borderWidthLabel}</span>
                  <NumberInput
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={gridBorder.borderWidth}
                    onChange={(borderWidth) =>
                      handleGridBorderChange({ borderWidth })
                    }
                  />
                </div>
                <div className="field-row">
                  <span className="field-label">{t.inspector.borderColorLabel}</span>
                  <div className="color-input-container">
                    <input
                      type="color"
                      className="color-picker-input"
                      value={gridBorder.borderColor}
                      onChange={(e) =>
                        handleGridBorderChange({ borderColor: e.target.value })
                      }
                    />
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                      {gridBorder.borderColor}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weekday Row Border (Main & Mini) */}
        <div className="field-group">
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
            {t.inspector.weekdayBorderLabel}
          </div>
          <div className="field-row">
            <span className="field-label">{t.weekday.showBorderLabel}</span>
            <input
              type="checkbox"
              checked={weekdaySettings.showBorder ?? false}
              onChange={(e) => handleWeekdayBorderChange({ showBorder: e.target.checked })}
              style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent-primary)" }}
            />
          </div>

          {weekdaySettings.showBorder && (
            <div className="weekday-border-options" style={{ marginTop: "6px" }}>
              <div className="field-row">
                <span className="field-label">{t.weekday.borderWidthLabel}</span>
                <NumberInput
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={weekdaySettings.borderWidth ?? 1}
                  onChange={(borderWidth) => handleWeekdayBorderChange({ borderWidth })}
                />
              </div>
              <div className="field-row">
                <span className="field-label">{t.weekday.borderColorLabel}</span>
                <div className="color-input-container">
                  <input
                    type="color"
                    className="color-picker-input"
                    value={weekdaySettings.borderColor ?? "#E5E7EB"}
                    onChange={(e) => handleWeekdayBorderChange({ borderColor: e.target.value })}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                    {weekdaySettings.borderColor ?? "#E5E7EB"}
                  </span>
                </div>
              </div>
            </div>
          )}
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

