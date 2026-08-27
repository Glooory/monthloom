import React from "react";
import type { CalendarColors } from "../model/types";

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
  if (isDateElement && calendarColors && onChangeCalendarColors) {
    return (
      <div className="inspector-section">
        <div className="section-heading">日期颜色</div>
        <div className="field-group">
          <div className="field-row">
            <span className="field-label">工作日</span>
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
            <span className="field-label">周日</span>
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
            <span className="field-label">周六</span>
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

          <div className="field-row">
            <span className="field-label">日本节假日</span>
            <div className="color-input-container">
              <input
                type="color"
                className="color-picker-input"
                value={calendarColors.japanHoliday}
                onChange={(e) =>
                  onChangeCalendarColors({ ...calendarColors, japanHoliday: e.target.value })
                }
              />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{calendarColors.japanHoliday}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (color && onChangeColor) {
    return (
      <div className="inspector-section">
        <div className="section-heading">颜色</div>
        <div className="field-row">
          <span className="field-label">文本颜色</span>
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
