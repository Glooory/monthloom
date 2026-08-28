import React, { useState, useEffect } from "react";
import { useI18n } from "../../shared/i18n/i18nStore";

export interface WeekdayInspectorProps {
  labels: readonly string[];
  selectedIndex?: number;
  onChangeLabels: (nextLabels: readonly string[]) => void;
}

export const WeekdayInspector: React.FC<WeekdayInspectorProps> = ({
  labels,
  selectedIndex,
  onChangeLabels,
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
    const list = [...labels];
    while (list.length < 7) {
      list.push("");
    }
    return list.slice(0, 7);
  });

  useEffect(() => {
    const list = [...labels];
    while (list.length < 7) {
      list.push("");
    }
    setDraftLabels(list.slice(0, 7));
  }, [labels]);

  const handleInputChange = (index: number, val: string) => {
    const updated = [...draftLabels];
    updated[index] = val;
    setDraftLabels(updated);
    onChangeLabels(updated);
  };

  const handlePresetSelect = (presetValues: readonly string[]) => {
    setDraftLabels([...presetValues]);
    onChangeLabels(presetValues);
  };

  const isCurrentPreset = (presetValues: readonly string[]) => {
    if (draftLabels.length !== presetValues.length) return false;
    return draftLabels.every((v, i) => v === presetValues[i]);
  };

  return (
    <div className="inspector-section weekday-inspector">
      <div className="inspector-section-title">{t.weekday.sectionTitle}</div>

      {/* Preset Quick Actions */}
      <div className="weekday-presets-container">
        <label className="inspector-label" style={{ marginBottom: "6px", display: "block" }}>
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

      {/* 7 Day Inputs */}
      <div className="weekday-inputs-container">
        <label className="inspector-label" style={{ marginBottom: "6px", display: "block" }}>
          {t.weekday.columnsLabel}
        </label>
        <div className="weekday-inputs-grid">
          {t.weekday.dayLabels.map((dayName, idx) => {
            const isHighlighted = selectedIndex === idx;
            return (
              <div
                key={idx}
                className={`weekday-input-col ${isHighlighted ? "highlighted" : ""}`}
              >
                <span className="weekday-col-header">{dayName}</span>
                <input
                  type="text"
                  className="inspector-input weekday-col-input"
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
