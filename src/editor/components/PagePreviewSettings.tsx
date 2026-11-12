import React, { useRef, useId } from "react";
import type { PageLayout, PagePreviewConfig, VerticalAlignment } from "../../domain/pagePreview/types";
import { useI18n } from "../../shared/i18n/i18nStore";
import { calculatePageGeometry } from "../../domain/pagePreview/pageLayout";
import { NumberInput } from "./NumberInput";

export interface AssetStoreLike {
  addImage(file: File | Blob): Promise<string>;
}

export interface PagePreviewSettingsProps {
  config: PagePreviewConfig;
  mainSize: Readonly<{ width: number; height: number }>;
  miniSize: Readonly<{ width: number; height: number }>;
  onChange: (next: PagePreviewConfig) => void;
  assetStore?: AssetStoreLike;
}

const NumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
}> = ({ label, value, step, min, max, onChange }) => {
  const id = useId();
  return (
    <div className="field-row" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <label htmlFor={id} className="field-label" style={{ fontSize: "12px", color: "var(--text-secondary)", minWidth: 0, whiteSpace: "nowrap" }}>{label}</label>
      <NumberInput
        id={id}
        value={value}
        style={{ width: 76, flex: "none" }}
        step={step}
        min={min}
        max={max}
        onChange={onChange}
      />
    </div>
  );
};

export const PagePreviewSettings: React.FC<PagePreviewSettingsProps> = ({
  config,
  mainSize,
  miniSize,
  onChange,
  assetStore,
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layout = config.layout;
  const geometry = calculatePageGeometry({ layout, mainSize, miniSize });
  const dimensions = {
    mainWidth: geometry.main.width,
    mainHeight: geometry.main.height,
    miniWidth: geometry.previousMini.width,
    miniHeight: geometry.previousMini.height,
  };

  const updateLayout = (updates: Partial<PageLayout>) => {
    onChange({
      ...config,
      layout: {
        ...config.layout,
        ...updates,
      },
    });
  };

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assetStore) return;
    try {
      const assetId = await assetStore.addImage(file);
      onChange({
        ...config,
        backgroundAssetId: assetId,
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearBackground = () => {
    onChange({
      ...config,
      backgroundAssetId: undefined,
    });
  };

  return (
    <div
      className="page-preview-settings"
      style={{
        padding: "16px 20px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          {t.pagePreview.heading}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleUploadBackground}
          />
          <button
            type="button"
            className="studio-btn studio-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {config.backgroundAssetId ? t.pagePreview.replaceBackground : t.pagePreview.uploadBackground}
          </button>
          {config.backgroundAssetId && (
            <button
              type="button"
              className="studio-btn"
              style={{
                background: "rgba(244, 63, 94, 0.15)",
                color: "var(--accent-rose)",
                borderColor: "rgba(244, 63, 94, 0.3)",
              }}
              onClick={handleClearBackground}
            >
              {t.pagePreview.clearBackground}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px" }}>
        <NumberField
          label={t.pagePreview.widthLabel}
          value={layout.width}
          step={10}
          min={100}
          onChange={(width) => updateLayout({ width })}
        />
        <NumberField
          label={t.pagePreview.heightLabel}
          value={layout.height}
          step={10}
          min={100}
          onChange={(height) => updateLayout({ height })}
        />
        <NumberField
          label={t.pagePreview.paddingLabel}
          value={layout.padding}
          step={5}
          min={0}
          onChange={(padding) => updateLayout({ padding })}
        />
        {(["mainWidth", "mainHeight", "miniWidth", "miniHeight"] as const).map((key) => (
          <NumberField
            key={key}
            label={t.pagePreview[`${key}Label`]}
            value={Number(dimensions[key].toFixed(2))}
            step={10}
            min={1}
            onChange={(value) => updateLayout({ ...dimensions, [key]: value })}
          />
        ))}
        {(["mainVerticalAlignment", "miniVerticalAlignment"] as const).map((key) => (
          <label key={key} className="field-row" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span className="field-label" style={{ fontSize: "12px", color: "var(--text-secondary)", minWidth: 0, whiteSpace: "nowrap" }}>
              {key === "mainVerticalAlignment" ? t.pagePreview.mainVerticalAlignmentLabel : t.pagePreview.miniVerticalAlignmentLabel}
            </span>
            <select
              className="field-input"
              style={{ width: "auto", flex: "none" }}
              value={layout[key] ?? "top"}
              onChange={(event) => updateLayout({ [key]: event.target.value as VerticalAlignment })}
            >
              <option value="top">{t.pagePreview.alignTop}</option>
              <option value="center">{t.pagePreview.alignCenter}</option>
              <option value="bottom">{t.pagePreview.alignBottom}</option>
            </select>
          </label>
        ))}
        <NumberField
          label={t.pagePreview.miniGapLabel}
          value={layout.miniGap}
          step={2}
          min={0}
          onChange={(miniGap) => updateLayout({ miniGap })}
        />
      </div>
    </div>
  );
};

