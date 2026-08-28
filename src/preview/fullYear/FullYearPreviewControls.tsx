import React from "react";
import { useI18n } from "../../shared/i18n/i18nStore";

export interface FullYearPreviewControlsProps {
  targetYear: number;
  onTargetYearChange: (year: number) => void;
}

export const FullYearPreviewControls: React.FC<FullYearPreviewControlsProps> = ({
  targetYear,
  onTargetYearChange,
}) => {
  const { t } = useI18n();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        background: "#090d16",
        borderBottom: "1px solid #1e293b",
        color: "#f8fafc",
        fontSize: "13px",
      }}
    >
      <strong style={{ color: "#38bdf8" }}>{t.nav.fullYearGalleryTab}</strong>
      <span style={{ color: "#475569" }}>|</span>
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span>{t.nav.targetYearLabel}：</span>
        <input
          type="number"
          style={{
            background: "#1e293b",
            color: "#f8fafc",
            border: "1px solid #334155",
            borderRadius: "4px",
            padding: "2px 8px",
            fontSize: "12px",
            width: "70px",
          }}
          value={targetYear}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val > 1900 && val < 2200) {
              onTargetYearChange(val);
            }
          }}
        />
      </label>
    </div>
  );
};
