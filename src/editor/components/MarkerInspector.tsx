import React, { useState, useEffect } from "react";
import type { MarkerTemplate } from "../../domain/template/primitives";
import type { FontDescriptor } from "../../domain/template/font";
import { TypographyInspector } from "./TypographyInspector";
import { ColorInspector } from "./ColorInspector";
import { NumberInput } from "./NumberInput";
import { memoryAssetStore } from "../assets/memoryAssetStore";
import { useI18n } from "../../shared/i18n/i18nStore";

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
  const { t } = useI18n();
  const [draftValue, setDraftValue] = useState(marker.type === "text" ? marker.value : "");

  useEffect(() => {
    if (marker.type === "text") {
      setDraftValue(marker.value);
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
      <div className="section-heading">{t.inspector.markerHeading}</div>

      <div className="field-row" style={{ marginBottom: 12 }}>
        <span className="field-label">{t.inspector.markerTypeLabel}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className={`toolbar-btn ${marker.type === "text" ? "active" : ""}`}
            onClick={() => toggleType("text")}
          >
            {t.inspector.markerTypeText}
          </button>
          <button
            type="button"
            className={`toolbar-btn ${marker.type === "image" ? "active" : ""}`}
            onClick={() => toggleType("image")}
          >
            {t.inspector.markerTypeImage}
          </button>
        </div>
      </div>

      {marker.type === "text" && (
        <>
          <div className="field-row" style={{ marginBottom: 12 }}>
            <span className="field-label">{t.inspector.markerTextLabel}</span>
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
            <span className="field-label">{t.inspector.markerImageFileLabel}</span>
            <input
              type="file"
              accept="image/*"
              className="field-input"
              onChange={handleFileUpload}
            />
          </div>

          <div className="field-row">
            <span className="field-label">{t.inspector.markerWidthLabel}</span>
            <NumberInput
              min={1}
              step={1}
              value={marker.width}
              onChange={(width) => onChangeMarker({ ...marker, width })}
            />
          </div>

          <div className="field-row">
            <span className="field-label">{t.inspector.markerHeightLabel}</span>
            <NumberInput
              min={1}
              step={1}
              value={marker.height}
              onChange={(height) => onChangeMarker({ ...marker, height })}
            />
          </div>

          <div className="field-row">
            <span className="field-label">{t.inspector.opacityLabel}</span>
            <NumberInput
              min={0}
              max={1}
              step={0.05}
              value={marker.opacity}
              onChange={(opacity) => onChangeMarker({ ...marker, opacity })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
