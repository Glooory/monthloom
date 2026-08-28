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
      <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
        节假日数据
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
          className="studio-btn studio-btn-secondary"
          style={{ fontSize: "12px", padding: "5px 10px" }}
        >
          {chinaDataset ? "替换中国节假日 (JSON)" : "导入中国节假日 (JSON)"}
        </button>
        {chinaDataset && (
          <button
            type="button"
            onClick={() => onImportChina(null)}
            className="studio-btn"
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              color: "var(--accent-rose)",
              background: "rgba(244, 63, 94, 0.1)",
              borderColor: "rgba(244, 63, 94, 0.25)",
            }}
          >
            清除 ({chinaDataset.entries.length} 天)
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
          className="studio-btn studio-btn-secondary"
          style={{ fontSize: "12px", padding: "5px 10px" }}
        >
          {japanDataset ? "替换日本节假日 (JSON)" : "导入日本节假日 (JSON)"}
        </button>
        {japanDataset && (
          <button
            type="button"
            onClick={() => onImportJapan(null)}
            className="studio-btn"
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              color: "var(--accent-rose)",
              background: "rgba(244, 63, 94, 0.1)",
              borderColor: "rgba(244, 63, 94, 0.25)",
            }}
          >
            清除 ({japanDataset.entries.length} 天)
          </button>
        )}
      </div>
    </div>
  );
};

