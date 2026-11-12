import React, { useState, useMemo, useRef } from "react";
import type { HolidayDiagnostic, HolidayIndex } from "../../domain/holiday/types";
import { calculatePageGeometry } from "../../domain/pagePreview/pageLayout";
import { useDocumentStore } from "../../editor/state/documentStore";
import type { AssetResolver } from "../../resources/assets/types";
import { resolveBackgroundDataUri } from "./background";
import { createFullYearCalendarSet } from "./calendarSet";
import { collectFullYearPreviewFontRequirements } from "./fontRequirements";
import { PagePreview } from "./PagePreview";
import {
  renderFullYearPreviewDocuments,
} from "./renderDocuments";
import { useI18n } from "../../shared/i18n/i18nStore";
import { usePreviewFonts } from "../../resources/fonts/usePreviewFonts";
import { usePreviewResource } from "../../shared/react/usePreviewResource";
import { PreviewStatusBanner } from "../../shared/react/PreviewStatusBanner";
import "./full-year-preview.css";

export interface FullYearPreviewProps {
  targetYear: number;
  holidayIndex?: HolidayIndex;
  coverageDiagnostics?: readonly HolidayDiagnostic[];
  assetResolver: AssetResolver;
  fetchImpl?: typeof fetch;
}

export const FullYearPreview: React.FC<FullYearPreviewProps> = ({
  targetYear,
  holidayIndex,
  coverageDiagnostics = [],
  assetResolver,
  fetchImpl,
}) => {
  const { t } = useI18n();
  // Subscribe only to canonical committed document
  const document = useDocumentStore((state) => state.document);

  const mainStartOfWeek = document.mainTemplate.weekdayRow.startOfWeek ?? 0;
  const miniStartOfWeek = document.miniTemplate.weekdayRow.startOfWeek ?? 0;

  // 1. Calendar set (13 pages, 13 main, 15 mini)
  const calendarSet = useMemo(() => {
    return createFullYearCalendarSet({
      targetYear,
      holidayIndex,
      mainStartOfWeek,
      miniStartOfWeek,
    });
  }, [targetYear, holidayIndex, mainStartOfWeek, miniStartOfWeek]);

  // 2. Full-year merged font requirements
  const fontRequirements = useMemo(() => {
    return collectFullYearPreviewFontRequirements({
      calendarSet,
      mainTemplate: document.mainTemplate,
      miniTemplate: document.miniTemplate,
      holidayLayers: document.holidayLayers,
    });
  }, [calendarSet, document.mainTemplate, document.miniTemplate, document.holidayLayers]);

  const { fontEngine, issues, loading: fontLoading, error: fontError, retry: retryFonts } = usePreviewFonts({
    catalog: document.fontCatalog, requirements: fontRequirements, assetResolver, fetchImpl,
  });
  const renderInputs = useMemo(() => ({
    calendarSet,
    mainTemplate: document.mainTemplate,
    miniTemplate: document.miniTemplate,
    holidayLayers: document.holidayLayers,
    fontEngine,
    assetResolver,
  }), [
    calendarSet,
    document.mainTemplate,
    document.miniTemplate,
    document.holidayLayers,
    fontEngine,
    assetResolver,
  ]);
  const backgroundKey = useMemo(() => ({ assetId: document.pagePreview.backgroundAssetId, assetResolver }),
    [document.pagePreview.backgroundAssetId, assetResolver]);
  const background = usePreviewResource({ resourceKey: backgroundKey,
    load: () => resolveBackgroundDataUri(backgroundKey), retainPrevious: false });

  // 6. Page geometry shared by all 13 pages
  const nextGeometry = useMemo(() => {
    return calculatePageGeometry({
      layout: document.pagePreview.layout,
      mainSize: {
        width: document.mainTemplate.width,
        height: document.mainTemplate.height,
      },
      miniSize: {
        width: document.miniTemplate.width,
        height: document.miniTemplate.height,
      },
    });
  }, [
    document.pagePreview.layout,
    document.mainTemplate.width,
    document.mainTemplate.height,
    document.miniTemplate.width,
    document.miniTemplate.height,
  ]);

  const previewKey = useMemo(() => ({ renderInputs, nextGeometry, backgroundDataUri: background.value,
    backgroundLoading: background.loading, backgroundError: background.error }),
    [renderInputs, nextGeometry, background.value, background.loading, background.error]);
  const preview = usePreviewResource({ resourceKey: previewKey, load: async () => {
    if (!fontEngine || background.loading || background.error) return null;
    const documents = await renderFullYearPreviewDocuments({ ...renderInputs, fontEngine });
    return { documents, calendarSet, geometry: nextGeometry, backgroundDataUri: background.value, targetYear };
  } });
  const lastPreview = useRef<NonNullable<typeof preview.value> | null>(null);
  if (preview.value) lastPreview.current = preview.value;
  const displayed = lastPreview.current?.targetYear === targetYear ? lastPreview.current : null;
  const documents = displayed?.documents ?? null;
  const displayedCalendarSet = displayed?.calendarSet ?? calendarSet;
  const geometry = displayed?.geometry ?? nextGeometry;
  const backgroundDataUri = displayed?.backgroundDataUri ?? null;
  const loading = fontLoading || preview.loading || background.loading;
  const error = fontError ?? preview.error ?? background.error;

  const STORAGE_KEY = "monthloom_preview_mode";

  const [viewMode, setViewModeState] = useState<"grid" | "focus" | "flow">(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "grid" || saved === "focus" || saved === "flow") {
          return saved;
        }
      }
    } catch {
      // ignore storage access errors
    }
    return "flow";
  });

  const setViewMode = (mode: "grid" | "focus" | "flow") => {
    setViewModeState(mode);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, mode);
      }
    } catch {
      // ignore storage access errors
    }
  };

  const [focusPageIndex, setFocusPageIndex] = useState(0);

  return (
    <div className="full-year-preview-container full-year-preview-studio">
      <PreviewStatusBanner error={error} issues={issues} loading={loading} retained={!!documents}
        retry={() => { retryFonts(); preview.retry(); background.retry(); }} />
      {/* Top View Mode Control Bar */}
      <div className="gallery-control-bar">
        <div className="gallery-mode-switch">
          <button
            type="button"
            className={`gallery-tab-btn ${viewMode === "flow" ? "active" : ""}`}
            onClick={() => setViewMode("flow")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="2" x2="12" y2="22" />
              <polyline points="19 15 12 22 5 15" />
            </svg>
            {t.gallery.viewModes.flow}
          </button>
          <button
            type="button"
            className={`gallery-tab-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            {t.gallery.viewModes.grid}
          </button>
          <button
            type="button"
            className={`gallery-tab-btn ${viewMode === "focus" ? "active" : ""}`}
            onClick={() => setViewMode("focus")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
            </svg>
            {t.gallery.viewModes.focus}
          </button>
        </div>

        <div className="gallery-actions">
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {t.gallery.yearSummary(targetYear)}
          </span>
        </div>
      </div>

      <div className="gallery-viewport">
        {/* Warning Banners */}
        {(geometry.warnings.length > 0 || coverageDiagnostics.length > 0) && (
          <div style={{ maxWidth: "1200px", margin: "0 auto 20px auto" }}>
            <div className="page-preview-warning-banner">
              {geometry.warnings.map((w, idx) => (
                <div key={`geom-${idx}`}>
                  <strong>[{w.code}]</strong> {w.message}
                </div>
              ))}
              {coverageDiagnostics.map((d, idx) => (
                <div key={`cov-${idx}`}>
                  <strong>[{d.code}]</strong> {d.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && !error && !documents && (
          <div className="loading-state-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <div>{t.gallery.loadingText}</div>
          </div>
        )}

        {/* 1. Grid Gallery View */}
        {documents && viewMode === "grid" && (
          <div className="gallery-grid">
            {displayedCalendarSet.pages.map((pageDef, idx) => {
              const mainKey = `${pageDef.mainMonth.year}-${pageDef.mainMonth.month}` as const;
              const prevKey = `${pageDef.previousMiniMonth.year}-${pageDef.previousMiniMonth.month}` as const;
              const nextKey = `${pageDef.nextMiniMonth.year}-${pageDef.nextMiniMonth.month}` as const;

              const mainDoc = documents.main.get(mainKey);
              const prevDoc = documents.mini.get(prevKey);
              const nextDoc = documents.mini.get(nextKey);

              if (!mainDoc || !prevDoc || !nextDoc) return null;

              return (
                <div
                  key={pageDef.label}
                  className="gallery-card"
                  onClick={() => {
                    setFocusPageIndex(idx);
                    setViewMode("focus");
                  }}
                >
                  <div className="gallery-card-header">
                    <span className="gallery-card-title">
                      {t.gallery.pageLabel(idx, pageDef.label)}
                    </span>
                    <span className="gallery-card-badge">{t.gallery.cardBadge}</span>
                  </div>
                  <PagePreview
                    definition={pageDef}
                    geometry={geometry}
                    mainDocument={mainDoc}
                    previousMiniDocument={prevDoc}
                    nextMiniDocument={nextDoc}
                    backgroundDataUri={backgroundDataUri}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Single Page Focus View */}
        {documents && viewMode === "focus" && (
          <div className="gallery-focus-container">
            {(() => {
              const pageDef = displayedCalendarSet.pages[focusPageIndex] ?? displayedCalendarSet.pages[0];
              const mainKey = `${pageDef.mainMonth.year}-${pageDef.mainMonth.month}` as const;
              const prevKey = `${pageDef.previousMiniMonth.year}-${pageDef.previousMiniMonth.month}` as const;
              const nextKey = `${pageDef.nextMiniMonth.year}-${pageDef.nextMiniMonth.month}` as const;

              const mainDoc = documents.main.get(mainKey);
              const prevDoc = documents.mini.get(prevKey);
              const nextDoc = documents.mini.get(nextKey);

              if (!mainDoc || !prevDoc || !nextDoc) return null;

              return (
                <>
                  <div className="focus-nav-bar">
                    <button
                      type="button"
                      className="studio-btn studio-btn-secondary"
                      disabled={focusPageIndex === 0}
                      onClick={() => setFocusPageIndex((p) => Math.max(0, p - 1))}
                    >
                      {t.gallery.prevPage}
                    </button>

                    <div className="focus-nav-title">
                      <span>{t.gallery.pageIndicator(focusPageIndex + 1, 13)}</span>
                      <span style={{ color: "var(--accent-cyan)", fontSize: "16px" }}>{pageDef.label}</span>
                    </div>

                    <button
                      type="button"
                      className="studio-btn studio-btn-secondary"
                      disabled={focusPageIndex === displayedCalendarSet.pages.length - 1}
                      onClick={() => setFocusPageIndex((p) => Math.min(displayedCalendarSet.pages.length - 1, p + 1))}
                    >
                      {t.gallery.nextPage}
                    </button>
                  </div>

                  <div style={{ width: "100%", maxWidth: "800px" }}>
                    <PagePreview
                      definition={pageDef}
                      geometry={geometry}
                      mainDocument={mainDoc}
                      previousMiniDocument={prevDoc}
                      nextMiniDocument={nextDoc}
                      backgroundDataUri={backgroundDataUri}
                    />
                  </div>

                  {/* Bottom Filmstrip */}
                  <div className="focus-filmstrip">
                    {displayedCalendarSet.pages.map((p, i) => (
                      <button
                        key={p.label}
                        type="button"
                        className={`filmstrip-item ${i === focusPageIndex ? "active" : ""}`}
                        onClick={() => setFocusPageIndex(i)}
                      >
                        {t.gallery.filmstripMonth(i + 1, p.label)}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* 3. Vertical Wall Flow View */}
        {documents && viewMode === "flow" && (
          <div className="full-year-flow-container">
            {displayedCalendarSet.pages.map((pageDef) => {
              const mainKey = `${pageDef.mainMonth.year}-${pageDef.mainMonth.month}` as const;
              const prevKey = `${pageDef.previousMiniMonth.year}-${pageDef.previousMiniMonth.month}` as const;
              const nextKey = `${pageDef.nextMiniMonth.year}-${pageDef.nextMiniMonth.month}` as const;

              const mainDoc = documents.main.get(mainKey);
              const prevDoc = documents.mini.get(prevKey);
              const nextDoc = documents.mini.get(nextKey);

              if (!mainDoc || !prevDoc || !nextDoc) return null;

              return (
                <PagePreview
                  key={pageDef.label}
                  definition={pageDef}
                  geometry={geometry}
                  mainDocument={mainDoc}
                  previousMiniDocument={prevDoc}
                  nextMiniDocument={nextDoc}
                  backgroundDataUri={backgroundDataUri}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
