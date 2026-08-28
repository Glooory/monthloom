import React from "react";
import type { CalendarColors } from "../model/types";
import { useI18n } from "../../shared/i18n/i18nStore";

export interface ColorInspectorProps {
  isDateElement?: boolean;
  calendarColors?: CalendarColors;
  color?: string;
  onChangeCalendarColors?: (next: CalendarColors) => void;
  onChangeColor?: (next: string) => void;
}

export const ColorInspector: React.FC<ColorInspectorProps> = ({
  isDateElement,
  calendarColors,
  color,
  onChangeCalendarColors,
  onChangeColor,
}) => {
  const { t } = useI18n();

  if (isDateElement && calendarColors && onChangeCalendarColors) {
    return (
      <div className="inspector-section">
        <div className="section-heading">{t.inspector.dateColorsHeading}</div>
        <div className="field-group">
          <div className="field-row">
            <span className="field-label">{t.inspector.weekdayColorLabel}</span>
            <div className="color-input-container">
              <input
                type="color"
                className="color-picker-input"
                value={calendarColors.default}
                onChange={(e) =>
                  onChangeCalendarColors({ ...calendarColors, default: e.target.value })
                }
              />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{calendarColors.default}</span>
            </div>
          </div>

          <div className="field-row">
            <span className="field-label">{t.inspector.sundayColorLabel}</span>
            <div className="color-input-container">
              <input
                type="color"
                className="color-picker-input"
                value={calendarColors.sunday}
                onChange={(e) =>
                  onChangeCalendarColors({ ...calendarColors, sunday: e.target.value })
                }
              />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{calendarColors.sunday}</span>
            </div>
          </div>

          <div className="field-row">
            <span className="field-label">{t.inspector.saturdayColorLabel}</span>
            <div className="color-input-container">
              <input
                type="color"
                className="color-picker-input"
                value={calendarColors.saturday}
                onChange={(e) =>
                  onChangeCalendarColors({ ...calendarColors, saturday: e.target.value })
                }
              />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{calendarColors.saturday}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (color && onChangeColor) {
    return (
      <div className="inspector-section">
        <div className="section-heading">{t.inspector.colorHeading}</div>
        <div className="field-row">
          <span className="field-label">{t.inspector.textColorLabel}</span>
          <div className="color-input-container">
            <input
              type="color"
              className="color-picker-input"
              value={color}
              onChange={(e) => onChangeColor(e.target.value)}
            />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{color}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
