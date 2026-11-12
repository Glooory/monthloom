import React, { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { FontSelectionContext } from "../fonts/FontSelectionContext";
import { supportsGoogleFontLanguage, type FontLanguageFilter } from "../../resources/fonts/googleFontCatalog";
import { createPortal } from "react-dom";
import type { Typography } from "../../domain/template/primitives";
import type { FontDescriptor } from "../../domain/template/font";
import type { BinaryAssetWriter } from "../../resources/assets/types";
import { parseFontkitFace } from "../../resources/fonts/fontkitEngine";
import { chooseGoogleFontFace, googleFontWeights, listGoogleFontFamilies, searchGoogleFontFamilies } from "../../resources/fonts/googleFontCatalog";
import {
  clearStoredInstalledFonts,
  getCachedInstalledFonts,
  getStoredInstalledFonts,
  localFontWeight,
  queryInstalledFonts,
  queryLocalFontFace,
  type LocalFontFace,
  type LocalFontOption,
} from "../fonts/localFonts";
import { useI18n } from "../../shared/i18n/i18nStore";
import { NumberInput } from "./NumberInput";
import { FontPickerList, type FontPickerRow } from "./FontPickerList";

export interface TypographyInspectorProps {
  typography: Typography;
  fontDescriptor?: FontDescriptor;
  onChangeTypography: (next: Typography) => void;
  onSelectFont?: (descriptor: FontDescriptor, typography: Typography) => void;
  fontAssetStore?: BinaryAssetWriter;
}

export const TypographyInspector: React.FC<TypographyInspectorProps> = ({
  typography,
  fontDescriptor,
  onChangeTypography,
  onSelectFont,
  fontAssetStore,
}) => {
  const { t } = useI18n();
  const prepareSelection = useContext(FontSelectionContext);
  const applyFont = (descriptor: FontDescriptor, next: Typography) => {
    localSelectionGeneration.current += 1;
    if (!onSelectFont) return;
    if (prepareSelection) prepareSelection.select(descriptor, next, onSelectFont);
    else onSelectFont(descriptor, next);
  };
  const [localFaces, setLocalFaces] = useState<LocalFontOption[] | null>(getCachedInstalledFonts);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  const [fontSearch, setFontSearch] = useState("");
  const [fontLanguage, setFontLanguage] = useState<FontLanguageFilter>("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const suppressFocusOpenRef = useRef(false);
  const localSelectionGeneration = useRef(0);
  useEffect(() => {
    localSelectionGeneration.current += 1;
    return () => { localSelectionGeneration.current += 1; };
  }, [fontDescriptor]);
  const listId = useId();
  const isLocal = fontDescriptor?.source.type === "local";
  const localPostscriptName = fontDescriptor?.source.type === "local"
    ? fontDescriptor.source.postscriptName : undefined;
  const selectedLocalIndex = localPostscriptName
    ? localFaces?.findIndex((face) => face.postscriptName === localPostscriptName)
    : -1;
  const selection = isLocal
    ? selectedLocalIndex !== undefined && selectedLocalIndex >= 0 ? `local:${selectedLocalIndex}` : "current-local"
    : `google:${fontDescriptor?.family ?? "Noto Sans"}`;
  const currentFamily = fontDescriptor?.family ?? "Noto Sans";
  const searchTerm = fontSearch.trim().toLocaleLowerCase();
  const googleMatches = searchTerm
    ? searchGoogleFontFamilies(fontSearch, 100, fontLanguage)
    : listGoogleFontFamilies(fontLanguage);
  const localMatches = localFaces?.map((face, index) => ({ face, index })).filter(({ face }) =>
    !searchTerm || [face.family, face.fullName, face.style, face.postscriptName]
      .some((name) => name.toLocaleLowerCase().includes(searchTerm)),
  ) ?? [];
  const googleFamilies = fontDescriptor?.source.type === "google" && supportsGoogleFontLanguage(fontDescriptor.family, fontLanguage) && !googleMatches.includes(fontDescriptor.family)
    ? [fontDescriptor.family, ...googleMatches]
    : googleMatches;
  const availableWeights = fontDescriptor?.source.type === "google"
    ? googleFontWeights(fontDescriptor.family, typography.fontStyle)
    : [];
  const italicAvailable = fontDescriptor?.source.type === "google"
    ? googleFontWeights(fontDescriptor.family, "italic").length > 0
    : true;
  const pickerRows: FontPickerRow[] = [
    ...(googleFamilies.length > 0 ? [
      { kind: "header" as const, label: t.inspector.googleFontsGroup },
      ...googleFamilies.map((family) => ({ kind: "google" as const, family, value: `google:${family}` })),
    ] : []),
    ...(localMatches.length > 0 ? [
      { kind: "header" as const, label: `${t.inspector.systemFontsGroup} · ${t.inspector.fontLanguageUnknown}` },
      ...localMatches.map(({ face, index }) => ({ kind: "local" as const, face, value: `local:${index}` })),
    ] : []),
  ];
  const selectedIndex = pickerRows.findIndex((row) => row.kind !== "header" && row.value === selection);
  const firstOptionIndex = pickerRows.findIndex((row) => row.kind !== "header");
  const closePicker = (restoreFocus = false) => {
    setPickerOpen(false);
    if (restoreFocus && document.activeElement !== searchRef.current) {
      suppressFocusOpenRef.current = true;
      searchRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!pickerOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [pickerOpen]);

  useLayoutEffect(() => {
    if (!pickerOpen) return;
    const updatePosition = () => {
      const search = searchRef.current?.getBoundingClientRect();
      const controls = pickerRef.current?.getBoundingClientRect();
      if (!search || !controls) return;
      const width = Math.min(Math.max(controls.width, search.width), window.innerWidth - 16);
      const desiredHeight = Math.min(264, Math.max(44, pickerRows.length * 44));
      const spaceBelow = Math.max(0, window.innerHeight - search.bottom - 8);
      const spaceAbove = Math.max(0, controls.top - 8);
      const above = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
      const maxHeight = Math.min(desiredHeight, above ? spaceAbove : spaceBelow);
      setPopoverPosition({
        left: Math.max(8, Math.min(controls.left, window.innerWidth - width - 8)),
        top: above
          ? controls.top - maxHeight - 4
          : search.bottom + 4,
        width,
        maxHeight,
      });
    };
    const updateOnAncestorScroll = (event: Event) => {
      if (!popoverRef.current?.contains(event.target as Node)) updatePosition();
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updateOnAncestorScroll, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updateOnAncestorScroll, true);
    };
  }, [pickerOpen, pickerRows.length]);

  useEffect(() => {
    if (!navigator.permissions?.query) {
      setPermissionChecked(true);
      return;
    }
    let active = true;
    void navigator.permissions.query({ name: "local-fonts" as PermissionName })
      .then((permission) => {
        if (!active) return;
        if (permission.state === "granted") {
          setLocalFaces(getCachedInstalledFonts() ?? getStoredInstalledFonts());
        } else {
          clearStoredInstalledFonts();
          setLocalFaces(null);
        }
      })
      .catch(() => {
        // The explicit load action remains available if permission lookup fails.
      })
      .finally(() => { if (active) setPermissionChecked(true); });
    return () => { active = false; };
  }, []);

  const loadLocalFonts = async () => {
    setLoadingFonts(true);
    setFontError(null);
    try {
      setLocalFaces(await queryInstalledFonts());
    } catch (error) {
      setFontError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingFonts(false);
    }
  };

  const selectFont = async (value: string) => {
    const generation = ++localSelectionGeneration.current;
    if (!fontDescriptor || !onSelectFont) return;
    prepareSelection?.cancel();
    setLoadingFonts(false);
    if (value === selection) {
      setFontSearch("");
      return;
    }
    setFontError(null);
    if (value.startsWith("google:")) {
      const family = value.slice(7);
      const face = chooseGoogleFontFace(family, typography.fontWeight, typography.fontStyle);
      setFontSearch("");
      applyFont(
        { ...fontDescriptor, family, ...face, source: { type: "google", family } },
        { ...typography, fontWeight: face.weight, fontStyle: face.style },
      );
      return;
    }
    const option = localFaces?.[Number(value.slice(6))];
    if (!option || !fontAssetStore) return;
    const facePromise: Promise<LocalFontFace> = option.blob
      ? Promise.resolve(option as LocalFontFace)
      : queryLocalFontFace(option.postscriptName);
    setLoadingFonts(true);
    try {
      const face = await facePromise;
      const bytes = await (await face.blob()).arrayBuffer();
      if (generation !== localSelectionGeneration.current) return;
      const weight = localFontWeight(face.style);
      const style = /italic|oblique/i.test(face.style) ? "italic" : "normal";
      const assetId = `font-${crypto.randomUUID()}`;
      const descriptor: FontDescriptor = {
        family: face.family,
        weight,
        style,
        source: { type: "local", assetId, postscriptName: face.postscriptName },
      };
      parseFontkitFace({ fontId: typography.fontId, descriptor, bytes });
      await fontAssetStore.setAsset(assetId, { bytes, mimeType: "font/sfnt" });
      if (generation !== localSelectionGeneration.current) return;
      setLoadingFonts(false);
      applyFont(descriptor, { ...typography, fontWeight: weight, fontStyle: style });
      setFontSearch("");
    } catch (error) {
      if (generation === localSelectionGeneration.current) {
        setFontError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (generation === localSelectionGeneration.current) setLoadingFonts(false);
    }
  };

  return (
    <div className="inspector-section">
      <div className="section-heading">{t.inspector.typographyHeading}</div>

      <div className="field-group">
        <div className="field-row">
          <label className="field-label" htmlFor={`${listId}-language`}>{t.inspector.fontLanguageLabel}</label>
          <select id={`${listId}-language`} className="field-input" value={fontLanguage}
            onChange={(event) => { setFontLanguage(event.target.value as FontLanguageFilter); setFontSearch(""); closePicker(); }}>
            <option value="all">{t.inspector.fontLanguageAll}</option>
            <option value="zh">{t.inspector.fontLanguageChinese}</option>
            <option value="ja">{t.inspector.fontLanguageJapanese}</option>
            <option value="zh-ja">{t.inspector.fontLanguageBoth}</option>
          </select>
        </div>
        <p className="font-language-hint">{t.inspector.fontLanguageHint}</p>
        <div ref={pickerRef} className="font-picker-controls">
          <div className="field-row">
            <label className="field-label" htmlFor="font-search">{t.inspector.fontFamilyLabel}</label>
            <div className="font-picker-input-wrap">
              <input
                ref={searchRef}
                id="font-search"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-expanded={pickerOpen}
                aria-controls={pickerOpen && pickerRows.length > 0 ? listId : undefined}
                className="field-input font-picker-combobox"
                placeholder={t.inspector.fontSearchLabel}
                autoComplete="off"
                value={pickerOpen ? fontSearch : currentFamily}
                onFocus={() => {
                  if (suppressFocusOpenRef.current) {
                    suppressFocusOpenRef.current = false;
                    return;
                  }
                  setFontSearch("");
                  setPickerOpen(true);
                }}
                onClick={() => {
                  if (!pickerOpen) {
                    setFontSearch("");
                    setPickerOpen(true);
                  }
                }}
                onChange={(event) => {
                  setFontSearch(event.target.value);
                  setPickerOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && pickerOpen) {
                    event.preventDefault();
                    document.getElementById(listId)?.focus();
                  } else if (event.key === "Enter" && searchTerm && (googleMatches[0] || localMatches[0])) {
                    event.preventDefault();
                    void selectFont(googleMatches[0]
                      ? `google:${googleMatches[0]}`
                      : `local:${localMatches[0].index}`);
                    closePicker();
                  } else if (event.key === "Escape") {
                    setFontSearch("");
                    closePicker();
                  }
                }}
              />
              <span className="font-picker-chevron" aria-hidden="true">▾</span>
            </div>
          </div>
        </div>

        {pickerOpen && popoverPosition && createPortal(
          <div
            ref={popoverRef}
            className="font-picker-popover"
            style={{
              position: "fixed",
              top: popoverPosition.top,
              left: popoverPosition.left,
              width: popoverPosition.width,
            }}
          >
            {pickerRows.length > 0 ? (
              <FontPickerList
                key={`${fontLanguage}:${fontSearch}`}
                id={listId}
                rows={pickerRows}
                selectedValue={selection}
                label={t.inspector.fontFamilyLabel}
                initialIndex={searchTerm || selectedIndex < 0 ? firstOptionIndex : selectedIndex}
                maxHeight={popoverPosition.maxHeight}
                onSelect={(value) => {
                  void selectFont(value);
                  closePicker(true);
                }}
                onClose={() => closePicker(true)}
              />
            ) : (
              <span className="font-search-empty">{t.inspector.noFontResults}</span>
            )}
          </div>,
          document.body,
        )}

        {permissionChecked && localFaces === null && (
          <button type="button" className="toolbar-btn" onClick={() => void loadLocalFonts()} disabled={loadingFonts || !fontAssetStore}>
            {loadingFonts ? t.inspector.loadingSystemFonts : t.inspector.loadSystemFonts}
          </button>
        )}
        {fontError && <p role="alert" className="font-picker-error">{fontError}</p>}

        <div className="field-row">
          <span className="field-label">{t.inspector.fontWeightLabel}</span>
          <select
            className="field-input"
            value={typography.fontWeight}
            disabled={isLocal}
            onChange={(e) => {
              const weight = parseInt(e.target.value, 10);
              if (fontDescriptor && onSelectFont) {
                applyFont({ ...fontDescriptor, weight }, { ...typography, fontWeight: weight });
              } else {
                onChangeTypography({ ...typography, fontWeight: weight });
              }
            }}
          >
            {![100, 200, 300, 400, 500, 600, 700, 800, 900].includes(typography.fontWeight) && (
              <option value={typography.fontWeight}>{typography.fontWeight}</option>
            )}
            {([100, 200, 300, 400, 500, 600, 700, 800, 900] as const)
              .filter((weight) => isLocal || availableWeights.length === 0 || availableWeights.includes(weight) || weight === typography.fontWeight)
              .map((weight) => (
                <option key={weight} value={weight}>
                  {weight === 300 ? t.inspector.fontWeights.light
                    : weight === 400 ? t.inspector.fontWeights.regular
                    : weight === 500 ? t.inspector.fontWeights.medium
                    : weight === 600 ? t.inspector.fontWeights.semiBold
                    : weight === 700 ? t.inspector.fontWeights.bold
                    : weight === 900 ? t.inspector.fontWeights.black
                    : weight}
                </option>
              ))}
          </select>
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.fontStyleLabel}</span>
          <select
            className="field-input"
            value={typography.fontStyle}
            disabled={isLocal}
            onChange={(e) => {
              const style = e.target.value as "normal" | "italic";
              if (fontDescriptor && onSelectFont) {
                const face = fontDescriptor.source.type === "google"
                  ? chooseGoogleFontFace(fontDescriptor.family, typography.fontWeight, style)
                  : { weight: typography.fontWeight, style };
                applyFont({ ...fontDescriptor, ...face }, { ...typography, fontWeight: face.weight, fontStyle: face.style });
              } else {
                onChangeTypography({ ...typography, fontStyle: style });
              }
            }}
          >
            <option value="normal">{t.inspector.fontStyles.normal}</option>
            <option value="italic" disabled={!italicAvailable}>{t.inspector.fontStyles.italic}</option>
          </select>
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.fontSizeLabel}</span>
          <NumberInput
            min={1}
            step={1}
            value={typography.fontSize}
            onChange={(fontSize) => onChangeTypography({ ...typography, fontSize })}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.letterSpacingLabel}</span>
          <NumberInput
            step={0.5}
            value={typography.letterSpacing}
            onChange={(letterSpacing) => onChangeTypography({ ...typography, letterSpacing })}
          />
        </div>

        <div className="field-row">
          <span className="field-label">{t.inspector.opacityLabel}</span>
          <NumberInput
            min={0}
            max={1}
            step={0.05}
            value={typography.opacity}
            onChange={(opacity) => onChangeTypography({ ...typography, opacity })}
          />
        </div>
      </div>
    </div>
  );
};
