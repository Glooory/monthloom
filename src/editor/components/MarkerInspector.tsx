import React, { useState, useEffect } from "react";
import type { MarkerTemplate } from "../../domain/template/primitives";
import type { FontDescriptor } from "../../domain/template/font";
import { TypographyInspector } from "./TypographyInspector";
import { ColorInspector } from "./ColorInspector";
import { memoryAssetStore } from "../assets/memoryAssetStore";

export interface MarkerInspectorProps {
  marker: MarkerTemplate;
  fontDescriptor?: FontDescriptor;
  onChangeMarker: (next: MarkerTemplate) => void;
  onChangeFontDescriptor?: (next: FontDescriptor) => void;
}

export const MarkerInspector: React.FC<MarkerInspectorProps> = ({
  marker,
  fontDescriptor,
  onChangeMarker,
  onChangeFontDescriptor,
}) => {
  const [draftValue, setDraftValue] = useState(marker.type === "text" ? marker.value : "");
  const [draftWidth, setDraftWidth] = useState(
    marker.type === "image" ? String(marker.width) : "16",
  );
  const [draftHeight, setDraftHeight] = useState(
    marker.type === "image" ? String(marker.height) : "16",
  );
  const [draftOpacity, setDraftOpacity] = useState(
    marker.type === "image" ? String(marker.opacity) : "1",
  );

  useEffect(() => {
    if (marker.type === "text") {
      setDraftValue(marker.value);
    } else {
      setDraftWidth(String(marker.width));
      setDraftHeight(String(marker.height));
      setDraftOpacity(String(marker.opacity));
    }
  }, [marker]);

  const toggleType = (nextType: "text" | "image") => {
    if (nextType === marker.type) return;

    if (nextType === "text") {
      onChangeMarker({
        type: "text",
        value: "休",
        position: marker.position,
        typography: {
          fontId: "main.marker",
          fontSize: 10,
          fontWeight: 500,
          fontStyle: "normal",
          letterSpacing: 0,
          color: "#DC2626",
          opacity: 1,
        },
      });
    } else {
      onChangeMarker({
        type: "image",
        assetId: "default-marker",
        position: marker.position,
        width: 16,
        height: 16,
        opacity: 1,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const assetId = await memoryAssetStore.addImage(file);
      if (marker.type === "image") {
        onChangeMarker({ ...marker, assetId });
      }
    } catch (err) {
      console.error("Failed to upload marker image:", err);
    }
  };

  return (
    <div className="inspector-section">
      <div className="section-heading">角标标记</div>

      <div className="field-row" style={{ marginBottom: 12 }}>
        <span className="field-label">类型</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className={`toolbar-btn ${marker.type === "text" ? "active" : ""}`}
            onClick={() => toggleType("text")}
          >
            文字
          </button>
          <button
            type="button"
            className={`toolbar-btn ${marker.type === "image" ? "active" : ""}`}
            onClick={() => toggleType("image")}
          >
            图片
          </button>
        </div>
      </div>

      {marker.type === "text" && (
        <>
          <div className="field-row" style={{ marginBottom: 12 }}>
            <span className="field-label">文本内容</span>
            <input
              type="text"
              className="field-input"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              onBlur={() => {
                if (draftValue !== marker.value) {
                  onChangeMarker({ ...marker, value: draftValue });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onChangeMarker({ ...marker, value: draftValue });
                if (e.key === "Escape") setDraftValue(marker.value);
              }}
            />
          </div>

          <TypographyInspector
            typography={marker.typography}
            fontDescriptor={fontDescriptor}
            onChangeTypography={(nextTypo) => onChangeMarker({ ...marker, typography: nextTypo })}
            onChangeFontDescriptor={onChangeFontDescriptor}
          />

          <ColorInspector
            color={marker.typography.color}
            onChangeColor={(color) =>
              onChangeMarker({
                ...marker,
                typography: { ...marker.typography, color },
              })
            }
          />
        </>
      )}

      {marker.type === "image" && (
        <div className="field-group">
          <div className="field-row">
            <span className="field-label">图片文件</span>
            <input
              type="file"
              accept="image/*"
              className="field-input"
              onChange={handleFileUpload}
            />
          </div>

          <div className="field-row">
            <span className="field-label">宽度</span>
            <input
              type="number"
              className="field-input field-input-number"
              value={draftWidth}
              onChange={(e) => setDraftWidth(e.target.value)}
              onBlur={() => {
                const w = parseFloat(draftWidth);
                if (!isNaN(w) && w > 0 && w !== marker.width) {
                  onChangeMarker({ ...marker, width: w });
                }
              }}
            />
          </div>

          <div className="field-row">
            <span className="field-label">高度</span>
            <input
              type="number"
              className="field-input field-input-number"
              value={draftHeight}
              onChange={(e) => setDraftHeight(e.target.value)}
              onBlur={() => {
                const h = parseFloat(draftHeight);
                if (!isNaN(h) && h > 0 && h !== marker.height) {
                  onChangeMarker({ ...marker, height: h });
                }
              }}
            />
          </div>

          <div className="field-row">
            <span className="field-label">不透明度</span>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              className="field-input field-input-number"
              value={draftOpacity}
              onChange={(e) => setDraftOpacity(e.target.value)}
              onBlur={() => {
                const op = parseFloat(draftOpacity);
                if (!isNaN(op) && op >= 0 && op <= 1 && op !== marker.opacity) {
                  onChangeMarker({ ...marker, opacity: op });
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
