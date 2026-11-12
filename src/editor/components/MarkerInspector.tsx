import React, { useState, useEffect, useRef } from "react";
import type { MarkerTemplate } from "../../domain/template/primitives";
import type { FontDescriptor } from "../../domain/template/font";
import type { Typography } from "../../domain/template/primitives";
import type { BinaryAssetWriter } from "../../resources/assets/types";
import { TypographyInspector } from "./TypographyInspector";
import { ColorInspector } from "./ColorInspector";
import { NumberInput } from "./NumberInput";
import { memoryAssetStore } from "../assets/memoryAssetStore";
import { useI18n } from "../../shared/i18n/i18nStore";

export interface MarkerInspectorProps {
  marker: MarkerTemplate;
  defaultTextFontId: string;
  defaultTextFontDescriptor: FontDescriptor;
  fontDescriptor?: FontDescriptor;
  onChangeMarker: (next: MarkerTemplate) => void;
  onSelectFont?: (descriptor: FontDescriptor, typography: Typography) => void;
  fontAssetStore?: BinaryAssetWriter;
}

export const MarkerInspector: React.FC<MarkerInspectorProps> = ({
  marker,
  defaultTextFontId,
  defaultTextFontDescriptor,
  fontDescriptor,
  onChangeMarker,
  onSelectFont,
  fontAssetStore,
}) => {
  const { t } = useI18n();
  const uploadGeneration = useRef(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  useEffect(() => () => { uploadGeneration.current += 1; }, []);
  const [selectedType, setSelectedType] = useState(marker.type);
  useEffect(() => setSelectedType(marker.type), [marker.type]);

  const [draftValue, setDraftValue] = useState(marker.type === "text" ? marker.value : "");

  useEffect(() => {
    if (marker.type === "text") {
      setDraftValue(marker.value);
    }
  }, [marker]);

  const toggleType = (nextType: "text" | "image") => {
    uploadGeneration.current += 1;
    setUploadError(null);
    setSelectedType(nextType);
    if (nextType === marker.type || nextType === "image") return;

    if (nextType === "text") {
      onChangeMarker({
        type: "text",
        value: "休",
        position: marker.position,
        typography: {
          fontId: defaultTextFontId,
          fontSize: 10,
          fontWeight: defaultTextFontDescriptor.weight,
          fontStyle: defaultTextFontDescriptor.style,
          letterSpacing: 0,
          color: "#DC2626",
          opacity: 1,
        },
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const generation = ++uploadGeneration.current;
    setUploadError(null);
    try {
      const assetId = await memoryAssetStore.addImage(file);
      // The preview and export resolve through the supplied persistent store.
      if (fontAssetStore) {
        await fontAssetStore.setAsset(assetId, await memoryAssetStore.resolve(assetId));
      }
      if (generation !== uploadGeneration.current) return;
      onChangeMarker(marker.type === "image"
        ? { ...marker, assetId }
        : { type: "image", assetId, position: marker.position, width: 16, height: 16, opacity: 1 });
    } catch (err) {
      if (generation === uploadGeneration.current) {
        setUploadError(err instanceof Error ? err.message : String(err));
      }
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
            className={`toolbar-btn ${selectedType === "text" ? "active" : ""}`}
            onClick={() => toggleType("text")}
          >
            {t.inspector.markerTypeText}
          </button>
          <button
            type="button"
            className={`toolbar-btn ${selectedType === "image" ? "active" : ""}`}
            onClick={() => toggleType("image")}
          >
            {t.inspector.markerTypeImage}
          </button>
        </div>
      </div>

      {selectedType === "text" && marker.type === "text" && (
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
            onSelectFont={onSelectFont}
            fontAssetStore={fontAssetStore}
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

      {selectedType === "image" && (
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

          {uploadError && <div role="alert">{uploadError}</div>}
          {marker.type === "image" && (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
};
