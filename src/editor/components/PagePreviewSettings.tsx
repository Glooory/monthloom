import React, { useRef, useId } from "react";
import type { PageLayout, PagePreviewConfig, PageCalendar } from "../../domain/pagePreview/types";
import { useI18n } from "../../shared/i18n/i18nStore";
import { PositionInspector } from "./PositionInspector";
import { useUiStore } from "../state/uiStore";
import { NumberInput } from "./NumberInput";

export interface AssetStoreLike {
  addImage(file: File | Blob): Promise<string>;
}

export interface PagePreviewSettingsProps {
  config: PagePreviewConfig;
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
  onChange,
  assetStore,
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layout = config.layout;
  const selected = useUiStore((state) => state.pageSelection);
  const setSelected = useUiStore((state) => state.setPageSelection);
  const calendar = selected ? layout[selected] : null;
  const updateCalendar = (updates: Partial<PageLayout["main"]>) => {
    if (selected && calendar) updateLayout({ [selected]: { ...calendar, ...updates } });
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
        color: "var(--text-primary)",
      }}
    >
      <div className="page-preview-settings-header">
        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          {t.pagePreview.heading}
        </div>

        <div className="page-preview-background-actions">
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

      <div className="page-preview-page-dimensions">
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
      </div>
      <div className="page-calendar-settings" key={selected ?? "none"}>
        <label className="field-row">
          <span className="field-label">{t.pagePreview.calendarLabel}</span>
          <select className="field-input" value={selected ?? ""} onChange={(event) => setSelected(event.target.value ? event.target.value as PageCalendar : null)}>
            <option value="">{t.pagePreview.selectCalendarLabel}</option>
            <option value="main">{t.pagePreview.mainLabel}</option>
            <option value="previousMini">{t.pagePreview.previousMiniLabel}</option>
            <option value="nextMini">{t.pagePreview.nextMiniLabel}</option>
          </select>
        </label>
        {calendar && (
          <>
            <div className="page-calendar-dimensions">
              <NumberField label={t.pagePreview.calendarWidthLabel} value={calendar.width} min={1} step={10}
                onChange={(width) => updateCalendar({ width })} />
              <NumberField label={t.pagePreview.calendarHeightLabel} value={calendar.height} min={1} step={10}
                onChange={(height) => updateCalendar({ height })} />
            </div>
            <PositionInspector position={calendar.position} onChange={(position) => updateCalendar({ position })} />
          </>
        )}
      </div>
    </div>
  );
};
