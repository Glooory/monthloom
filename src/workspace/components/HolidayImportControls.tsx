import React, { useRef } from "react";
import type { HolidayDataset } from "../../domain/holiday/types";
import {
  parseChinaHolidayJsonString,
  parseJapanHolidayJsonString,
} from "../holiday/importHolidayJson";

export type HolidayImportControlsProps = {
  chinaDataset: HolidayDataset | null;
  japanDataset: HolidayDataset | null;
  onImportChina: (dataset: HolidayDataset | null) => void;
  onImportJapan: (dataset: HolidayDataset | null) => void;
};

export const HolidayImportControls: React.FC<HolidayImportControlsProps> = ({
  chinaDataset,
  japanDataset,
  onImportChina,
  onImportJapan,
}) => {
  const chinaInputRef = useRef<HTMLInputElement>(null);
  const japanInputRef = useRef<HTMLInputElement>(null);

  const handleChinaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const dataset = parseChinaHolidayJsonString(text);
      onImportChina(dataset);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleJapanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const dataset = parseJapanHolidayJsonString(text);
      onImportJapan(dataset);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ fontWeight: 600, fontSize: "13px", color: "#374151" }}>
        Holiday Datasets
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          ref={chinaInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleChinaFile}
          data-testid="china-holiday-input"
        />
        <button
          type="button"
          onClick={() => chinaInputRef.current?.click()}
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            background: "#F3F4F6",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {chinaDataset ? "Replace China JSON" : "Import China JSON"}
        </button>
        {chinaDataset && (
          <button
            type="button"
            onClick={() => onImportChina(null)}
            style={{
              padding: "4px 6px",
              fontSize: "11px",
              color: "#DC2626",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear ({chinaDataset.entries.length} days)
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          ref={japanInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleJapanFile}
          data-testid="japan-holiday-input"
        />
        <button
          type="button"
          onClick={() => japanInputRef.current?.click()}
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            background: "#F3F4F6",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {japanDataset ? "Replace Japan JSON" : "Import Japan JSON"}
        </button>
        {japanDataset && (
          <button
            type="button"
            onClick={() => onImportJapan(null)}
            style={{
              padding: "4px 6px",
              fontSize: "11px",
              color: "#DC2626",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear ({japanDataset.entries.length} days)
          </button>
        )}
      </div>
    </div>
  );
};
