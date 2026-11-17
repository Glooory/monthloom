import { BackgroundSettings } from "./BackgroundSettings";
import React, { useId } from "react";
import type { PageLayout, PagePreviewConfig, PageCalendar } from "../../domain/pagePreview/types";
import { useI18n } from "../../shared/i18n/i18nStore";
import { PositionInspector } from "./PositionInspector";
import { useUiStore } from "../state/uiStore";
import { NumberInput } from "./NumberInput";

export interface AssetStoreLike {
  resolve?: import("../../resources/assets/types").AssetResolver["resolve"];
  addImage(file: File | Blob): Promise<string>;
}

export interface PagePreviewSettingsProps {
  config: PagePreviewConfig;
  mainSize: Readonly<{ width: number; height: number }>;
  miniSize: Readonly<{ width: number; height: number }>;
  onSizeChange: (target: "main" | "mini", dimensions: { width?: number; height?: number }) => void;
  onChange: (next: PagePreviewConfig) => void;
  assetStore?: AssetStoreLike;
  onBackgroundMonthChange?: (month: string) => void;
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
  onSizeChange,
  onChange,
  assetStore,
  onBackgroundMonthChange,
}) => {
  const { t } = useI18n();
  const layout = config.layout;
  const pageSelection = useUiStore((state) => state.pageSelection);
  const selected = pageSelection && pageSelection !== "main" && layout[pageSelection].visible === false
    ? null : pageSelection;
  const setSelected = useUiStore((state) => state.setPageSelection);
  const calendar = selected ? layout[selected] : null;
  const size = selected === "main" ? mainSize : miniSize;
  const updateSize = (dimensions: { width?: number; height?: number }) => {
    if (selected) onSizeChange(selected === "main" ? "main" : "mini", dimensions);
  };
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

  return (
    <div
      className="page-preview-settings"
      style={{
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


      </div>

      <BackgroundSettings config={config} onChange={onChange} assetStore={assetStore} onMonthChange={onBackgroundMonthChange} />
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
      <div className="page-mini-visibility">
        <span className="field-label">{t.pagePreview.miniVisibilityLabel}</span>
        {(["previousMini", "nextMini"] as const).map((role) => (
          <label key={role}>
            <input
              type="checkbox"
              checked={layout[role].visible !== false}
              onChange={(event) => {
                updateLayout({ [role]: { ...layout[role], visible: event.target.checked } });
                if (!event.target.checked && selected === role) setSelected(null);
              }}
            />
            {role === "previousMini" ? t.pagePreview.previousMiniLabel : t.pagePreview.nextMiniLabel}
          </label>
        ))}
      </div>
      <div className="page-calendar-settings" key={selected ?? "none"}>
        <label className="field-row">
          <span className="field-label">{t.pagePreview.calendarLabel}</span>
          <select className="field-input" value={selected ?? ""} onChange={(event) => setSelected(event.target.value ? event.target.value as PageCalendar : null)}>
            <option value="">{t.pagePreview.selectCalendarLabel}</option>
            <option value="main">{t.pagePreview.mainLabel}</option>
            {layout.previousMini.visible !== false && <option value="previousMini">{t.pagePreview.previousMiniLabel}</option>}
            {layout.nextMini.visible !== false && <option value="nextMini">{t.pagePreview.nextMiniLabel}</option>}
          </select>
        </label>
        {calendar && (
          <>
            <div className="page-calendar-dimensions">
              <NumberField label={t.pagePreview.calendarWidthLabel} value={size.width} min={50} max={10000} step={10}
                onChange={(width) => updateSize({ width })} />
              <NumberField label={t.pagePreview.calendarHeightLabel} value={size.height} min={50} max={10000} step={10}
                onChange={(height) => updateSize({ height })} />
            </div>
            <PositionInspector position={calendar.position} onChange={(position) => updateCalendar({ position })} />
          </>
        )}
      </div>
    </div>
  );
};
