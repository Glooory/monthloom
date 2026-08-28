import React from "react";
import type { HolidayDateColors } from "../../domain/template/holidayLayer";
import { useI18n } from "../../shared/i18n/i18nStore";

export type HolidayDateColorInspectorProps = {
  dateColors: HolidayDateColors;
  onChange: (next: HolidayDateColors) => void;
};

export const HolidayDateColorInspector: React.FC<
  HolidayDateColorInspectorProps
> = ({ dateColors, onChange }) => {
  const { t } = useI18n();

  return (
    <div className="inspector-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
          {t.holidayLayersUI.inspector.dateColorsHeading}
        </span>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={dateColors.enabled}
            onChange={(e) =>
              onChange({
                ...dateColors,
                enabled: e.target.checked,
              })
            }
          />
          {t.holidayLayersUI.inspector.enableDateColorsLabel}
        </label>
      </div>

      {dateColors.enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label htmlFor="holiday-color-input" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              {t.holidayLayersUI.inspector.holidayDateColorLabel}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                id="holiday-color-input"
                type="color"
                value={dateColors.holiday}
                onChange={(e) =>
                  onChange({
                    ...dateColors,
                    holiday: e.target.value,
                  })
                }
                style={{
                  width: "28px",
                  height: "28px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                {dateColors.holiday}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label htmlFor="workday-color-input" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              {t.holidayLayersUI.inspector.workdayDateColorLabel}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                id="workday-color-input"
                type="color"
                value={dateColors.workday}
                onChange={(e) =>
                  onChange({
                    ...dateColors,
                    workday: e.target.value,
                  })
                }
                style={{
                  width: "28px",
                  height: "28px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                {dateColors.workday}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
