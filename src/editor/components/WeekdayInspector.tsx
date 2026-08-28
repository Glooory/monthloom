import React, { useState, useEffect } from "react";
import { useI18n } from "../../shared/i18n/i18nStore";
import type { WeekdayRowSettings } from "../model/templateBindings";
import { NumberInput } from "./NumberInput";

export interface WeekdayInspectorProps {
  settings: WeekdayRowSettings;
  selectedIndex?: number;
  onChangeSettings: (nextSettings: Partial<WeekdayRowSettings>) => void;
}

export const WeekdayInspector: React.FC<WeekdayInspectorProps> = ({
  settings,
  selectedIndex,
  onChangeSettings,
}) => {
  const { t } = useI18n();

  const PRESETS: Array<{ label: string; name: string; values: readonly string[] }> = [
    { label: "Sun - Sat", name: t.weekday.presets.shortEn, values: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
    { label: "S M T W T F S", name: t.weekday.presets.singleEn, values: ["S", "M", "T", "W", "T", "F", "S"] },
    { label: "Su Mo Tu We Th Fr Sa", name: t.weekday.presets.twoLetterEn, values: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] },
    { label: "SUN - SAT", name: t.weekday.presets.upperEn, values: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] },
    { label: "日 一 二 三 四 五 六", name: t.weekday.presets.singleCn, values: ["日", "一", "二", "三", "四", "五", "六"] },
    { label: "周日 - 周六", name: t.weekday.presets.prefixCn, values: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] },
    { label: "星期日 - 星期六", name: t.weekday.presets.fullCn, values: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] },
    { label: "日 月 火 水 木 金 土", name: t.weekday.presets.japanese, values: ["日", "月", "火", "水", "木", "金", "土"] },
  ];

  const [draftLabels, setDraftLabels] = useState<string[]>(() => {
    const list = [...settings.labels];
    while (list.length < 7) {
      list.push("");
    }
    return list.slice(0, 7);
  });

  useEffect(() => {
    const list = [...settings.labels];
    while (list.length < 7) {
      list.push("");
    }
    setDraftLabels(list.slice(0, 7));
  }, [settings.labels]);

  const handleInputChange = (index: number, val: string) => {
    const updated = [...draftLabels];
    updated[index] = val;
    setDraftLabels(updated);
    onChangeSettings({ labels: updated });
  };

  const handlePresetSelect = (presetValues: readonly string[]) => {
    setDraftLabels([...presetValues]);
    onChangeSettings({ labels: presetValues });
  };

  const isCurrentPreset = (presetValues: readonly string[]) => {
    if (draftLabels.length !== presetValues.length) return false;
    return draftLabels.every((v, i) => v === presetValues[i]);
  };

  return (
    <div className="inspector-section weekday-inspector">
      <div className="section-heading">{t.weekday.sectionTitle}</div>

      {/* 1. Row Height */}
      <div className="field-row">
        <label className="field-label">{t.weekday.heightLabel}</label>
        <NumberInput
          min={10}
          max={300}
          step={1}
          isInteger
          value={settings.height}
          onChange={(height) => onChangeSettings({ height })}
        />
      </div>

      {/* 2. Start of Week (Sunday vs Monday) */}
      <div className="field-group">
        <label className="field-label">{t.weekday.startOfWeekHeading}</label>
        <div className="weekday-segmented-control">
          <button
            type="button"
            className={`weekday-segment-btn ${settings.startOfWeek === 0 ? "active" : ""}`}
            onClick={() => onChangeSettings({ startOfWeek: 0 })}
          >
            {t.weekday.startOfWeekSunday}
          </button>
          <button
            type="button"
            className={`weekday-segment-btn ${settings.startOfWeek === 1 ? "active" : ""}`}
            onClick={() => onChangeSettings({ startOfWeek: 1 })}
          >
            {t.weekday.startOfWeekMonday}
          </button>
        </div>
      </div>

      {/* 3. Text Colors (Default, Sunday, Saturday) */}
      <div className="field-group" style={{ marginTop: "8px" }}>
        <label className="field-label" style={{ fontWeight: 600 }}>{t.weekday.colorsHeading}</label>
        
        {/* Default Color */}
        <div className="field-row">
          <label className="field-label">{t.weekday.defaultColorLabel}</label>
          <div className="color-input-container">
            <input
              type="color"
              className="color-picker-input"
              value={settings.colors.default ?? "#374151"}
              onChange={(e) =>
                onChangeSettings({
                  colors: { ...settings.colors, default: e.target.value },
                })
              }
            />
            <input
              type="text"
              className="field-input"
              value={settings.colors.default ?? "#374151"}
              onChange={(e) =>
                onChangeSettings({
                  colors: { ...settings.colors, default: e.target.value },
                })
              }
            />
          </div>
        </div>

        {/* Sunday Color */}
        <div className="field-row">
          <label className="field-label">{t.weekday.sundayColorLabel}</label>
          <div className="color-input-container">
            <input
              type="color"
              className="color-picker-input"
              value={settings.colors.sunday ?? "#DC2626"}
              onChange={(e) =>
                onChangeSettings({
                  colors: { ...settings.colors, sunday: e.target.value },
                })
              }
            />
            <input
              type="text"
              className="field-input"
              value={settings.colors.sunday ?? "#DC2626"}
              onChange={(e) =>
                onChangeSettings({
                  colors: { ...settings.colors, sunday: e.target.value },
                })
              }
            />
          </div>
        </div>

        {/* Saturday Color */}
        <div className="field-row">
          <label className="field-label">{t.weekday.saturdayColorLabel}</label>
          <div className="color-input-container">
            <input
              type="color"
              className="color-picker-input"
              value={settings.colors.saturday ?? "#2563EB"}
              onChange={(e) =>
                onChangeSettings({
                  colors: { ...settings.colors, saturday: e.target.value },
                })
              }
            />
            <input
              type="text"
              className="field-input"
              value={settings.colors.saturday ?? "#2563EB"}
              onChange={(e) =>
                onChangeSettings({
                  colors: { ...settings.colors, saturday: e.target.value },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* 4. Preset Quick Actions */}
      <div className="weekday-presets-container" style={{ marginTop: "8px" }}>
        <label className="field-label" style={{ marginBottom: "6px", display: "block" }}>
          {t.weekday.quickPresetsLabel}
        </label>
        <div className="weekday-presets-grid">
          {PRESETS.map((preset) => {
            const active = isCurrentPreset(preset.values);
            return (
              <button
                key={preset.label}
                type="button"
                className={`weekday-preset-btn ${active ? "active" : ""}`}
                onClick={() => handlePresetSelect(preset.values)}
                title={preset.values.join(" ")}
              >
                <span className="weekday-preset-title">{preset.name}</span>
                <span className="weekday-preset-example">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. 7 Day Inputs */}
      <div className="weekday-inputs-container" style={{ marginTop: "8px" }}>
        <label className="field-label" style={{ marginBottom: "6px", display: "block" }}>
          {t.weekday.columnsLabel}
        </label>
        <div className="weekday-inputs-grid">
          {t.weekday.dayLabels.map((dayName, idx) => {
            // In Sunday-start: idx matches column idx
            // In Monday-start: column idx 0 is Mon (idx 1), column idx 6 is Sun (idx 0)
            const colIndex = settings.startOfWeek === 1 ? (idx === 0 ? 6 : idx - 1) : idx;
            const isHighlighted = selectedIndex === colIndex;
            return (
              <div
                key={idx}
                className={`weekday-input-col ${isHighlighted ? "highlighted" : ""}`}
              >
                <span className="weekday-col-header">{dayName}</span>
                <input
                  type="text"
                  className="field-input weekday-col-input"
                  value={draftLabels[idx] ?? ""}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  placeholder={t.weekday.columnPlaceholder(idx)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
