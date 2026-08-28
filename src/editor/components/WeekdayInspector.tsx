import React, { useState, useEffect } from "react";

export interface WeekdayInspectorProps {
  labels: readonly string[];
  selectedIndex?: number;
  onChangeLabels: (nextLabels: readonly string[]) => void;
}

const PRESETS: Array<{ label: string; name: string; values: readonly string[] }> = [
  { label: "Sun - Sat", name: "英文缩写", values: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
  { label: "S M T W T F S", name: "英文单字", values: ["S", "M", "T", "W", "T", "F", "S"] },
  { label: "Su Mo Tu We Th Fr Sa", name: "英文双字", values: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] },
  { label: "SUN - SAT", name: "英文大写", values: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] },
  { label: "日 一 二 三 四 五 六", name: "中文单字", values: ["日", "一", "二", "三", "四", "五", "六"] },
  { label: "周日 - 周六", name: "中文周前缀", values: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] },
  { label: "星期日 - 星期六", name: "中文星期", values: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] },
  { label: "日 月 火 水 木 金 土", name: "日文星期", values: ["日", "月", "火", "水", "木", "金", "土"] },
];

const DAY_LABELS = [
  "日 (Sun)",
  "一 (Mon)",
  "二 (Tue)",
  "三 (Wed)",
  "四 (Thu)",
  "五 (Fri)",
  "六 (Sat)",
];

export const WeekdayInspector: React.FC<WeekdayInspectorProps> = ({
  labels,
  selectedIndex,
  onChangeLabels,
}) => {
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
      <div className="inspector-section-title">星期自定义文本</div>

      {/* Preset Quick Actions */}
      <div className="weekday-presets-container">
        <label className="inspector-label" style={{ marginBottom: "6px", display: "block" }}>
          快速预设
        </label>
        <div className="weekday-presets-grid">
          {PRESETS.map((preset) => {
            const active = isCurrentPreset(preset.values);
            return (
              <button
                key={preset.name}
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
          各星期列文本 (周日至周六)
        </label>
        <div className="weekday-inputs-grid">
          {DAY_LABELS.map((dayName, idx) => {
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
                  placeholder={`第${idx + 1}列`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
