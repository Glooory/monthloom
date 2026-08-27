import React, { useState, useEffect, useRef } from "react";
import type { PageLayout, PagePreviewConfig } from "../../domain/pagePreview/types";
import type { MemoryAssetStore } from "../assets/memoryAssetStore";

export interface PagePreviewSettingsProps {
  config: PagePreviewConfig;
  onChange: (next: PagePreviewConfig) => void;
  assetStore?: MemoryAssetStore;
}

interface NumberFieldProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  step = 1,
  min,
  max,
  onChange,
}) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed !== value) {
      onChange(parsed);
    } else {
      setDraft(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commit();
    } else if (e.key === "Escape") {
      setDraft(String(value));
    }
  };

  return (
    <div className="field-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <span className="field-label" style={{ fontSize: "12px", color: "#94a3b8" }}>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        className="field-input field-input-number"
        style={{
          width: "90px",
          padding: "4px 8px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "4px",
          color: "#f8fafc",
          fontSize: "12px",
        }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export const PagePreviewSettings: React.FC<PagePreviewSettingsProps> = ({
  config,
  onChange,
  assetStore,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layout = config.layout;

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
    <div className="page-preview-settings" style={{ padding: "12px 16px", background: "#0f172a", borderTop: "1px solid #1e293b", color: "#f8fafc" }}>
      <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: 12, color: "#38bdf8" }}>
        Page Preview Layout Settings
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        <NumberField
          label="Page Width"
          value={layout.width}
          step={10}
          min={100}
          onChange={(width) => updateLayout({ width })}
        />
        <NumberField
          label="Page Height"
          value={layout.height}
          step={10}
          min={100}
          onChange={(height) => updateLayout({ height })}
        />
        <NumberField
          label="Padding"
          value={layout.padding}
          step={5}
          min={0}
          onChange={(padding) => updateLayout({ padding })}
        />
        <NumberField
          label="Left Col Ratio"
          value={layout.leftColumnRatio}
          step={0.02}
          min={0.05}
          max={0.95}
          onChange={(leftColumnRatio) => updateLayout({ leftColumnRatio })}
        />
        <NumberField
          label="Column Gap"
          value={layout.columnGap}
          step={2}
          min={0}
          onChange={(columnGap) => updateLayout({ columnGap })}
        />
        <NumberField
          label="Mini Height Ratio"
          value={layout.miniHeightRatio}
          step={0.02}
          min={0.05}
          max={0.95}
          onChange={(miniHeightRatio) => updateLayout({ miniHeightRatio })}
        />
        <NumberField
          label="Mini Gap"
          value={layout.miniGap}
          step={2}
          min={0}
          onChange={(miniGap) => updateLayout({ miniGap })}
        />
      </div>

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Background Image:</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleUploadBackground}
        />
        <button
          type="button"
          style={{
            padding: "4px 10px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "4px",
            color: "#f1f5f9",
            fontSize: "12px",
            cursor: "pointer",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {config.backgroundAssetId ? "Replace Background" : "Upload Background"}
        </button>
        {config.backgroundAssetId && (
          <button
            type="button"
            style={{
              padding: "4px 10px",
              background: "#450a0a",
              border: "1px solid #7f1d1d",
              borderRadius: "4px",
              color: "#fca5a5",
              fontSize: "12px",
              cursor: "pointer",
            }}
            onClick={handleClearBackground}
          >
            Clear Background
          </button>
        )}
      </div>
    </div>
  );
};
