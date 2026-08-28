import React, { useState, useEffect, useMemo, useRef } from "react";
import type { HolidayDiagnostic, HolidayIndex } from "../../domain/holiday/types";
import { calculatePageGeometry } from "../../domain/pagePreview/pageLayout";
import { useDocumentStore } from "../../editor/state/documentStore";
import type { AssetResolver } from "../../resources/assets/types";
import type { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";
import { resolveFontEngine } from "../../resources/fonts/resolveFonts";
import type { FontCatalog, FontTextRequirements } from "../../resources/fonts/types";
import { resolveBackgroundDataUri } from "./background";
import { createFullYearCalendarSet } from "./calendarSet";
import { collectFullYearPreviewFontRequirements } from "./fontRequirements";
import { PagePreview } from "./PagePreview";
import {
  renderFullYearPreviewDocuments,
  type FullYearPreviewDocuments,
} from "./renderDocuments";
import { useI18n } from "../../shared/i18n/i18nStore";
import "./full-year-preview.css";

export interface FullYearPreviewProps {
  targetYear: number;
  holidayIndex?: HolidayIndex;
  coverageDiagnostics?: readonly HolidayDiagnostic[];
  assetResolver: AssetResolver;
  fetchImpl?: typeof fetch;
}

function computeRequirementsKey(
  catalog: FontCatalog,
  requirements: FontTextRequirements,
): string {
  const parts: string[] = [];
  for (const [fontId, chars] of requirements) {
    const desc = catalog[fontId];
    const sourceKey =
      desc?.source.type === "local" ? desc.source.assetId : (desc?.source.family ?? "");
    parts.push(
      `${fontId}=${chars}@${desc?.family ?? ""}:${desc?.weight ?? 0}:${desc?.style ?? ""}:${sourceKey}`,
    );
  }
  parts.sort();
  return parts.join(";");
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

  const [fontEngine, setFontEngine] = useState<ResolvedFontEngine | null>(null);
  const [documents, setDocuments] = useState<FullYearPreviewDocuments | null>(null);
  const [backgroundDataUri, setBackgroundDataUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const currentFontKeyRef = useRef<string>("");
  const generationIdRef = useRef(0);

  // 1. Calendar set (13 pages, 13 main, 15 mini)
  const calendarSet = useMemo(() => {
    return createFullYearCalendarSet({ targetYear, holidayIndex });
  }, [targetYear, holidayIndex]);

  // 2. Full-year merged font requirements
  const fontRequirements = useMemo(() => {
    return collectFullYearPreviewFontRequirements({
      calendarSet,
      mainTemplate: document.mainTemplate,
      miniTemplate: document.miniTemplate,
    });
  }, [calendarSet, document.mainTemplate, document.miniTemplate]);

  // 3. Resolve Font Engine once per unique catalog & character requirements
  useEffect(() => {
    const reqKey = computeRequirementsKey(document.fontCatalog, fontRequirements);
    if (reqKey === currentFontKeyRef.current && fontEngine) {
      return;
    }

    let isMounted = true;

    resolveFontEngine({
      catalog: document.fontCatalog,
      requirements: fontRequirements,
      assetResolver,
      fetchImpl,
    })
      .then((engine) => {
        if (!isMounted) return;
        currentFontKeyRef.current = reqKey;
        setFontEngine(engine);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      isMounted = false;
    };
  }, [document.fontCatalog, fontRequirements, assetResolver, fetchImpl, fontEngine]);

  // 4. Resolve Background Asset
  useEffect(() => {
    let isMounted = true;
    resolveBackgroundDataUri({
      assetId: document.pagePreview.backgroundAssetId,
      assetResolver,
    }).then((uri) => {
      if (isMounted) {
        setBackgroundDataUri(uri);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [document.pagePreview.backgroundAssetId, assetResolver]);

  // 5. Render 13 Main and 15 Mini SvgDocuments asynchronously
  useEffect(() => {
    if (!fontEngine) return;

    const currentGeneration = ++generationIdRef.current;
    setLoading(true);

    renderFullYearPreviewDocuments({
      calendarSet,
      mainTemplate: document.mainTemplate,
      miniTemplate: document.miniTemplate,
      fontEngine,
      assetResolver,
    })
      .then((docs) => {
        if (currentGeneration === generationIdRef.current) {
          setDocuments(docs);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (currentGeneration === generationIdRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
  }, [
    calendarSet,
    document.mainTemplate,
    document.miniTemplate,
    fontEngine,
    assetResolver,
  ]);

  // 6. Page geometry shared by all 13 pages
  const geometry = useMemo(() => {
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

  if (error) {
    return (
      <div className="full-year-preview-container full-year-preview-studio">
        <div style={{ color: "var(--accent-rose)", padding: 24, textAlign: "center" }}>
          {t.errors.previewRenderError(error.message)}
        </div>
      </div>
    );
  }

  return (
    <div className="full-year-preview-container full-year-preview-studio">
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

        {loading && !documents && (
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
            {calendarSet.pages.map((pageDef, idx) => {
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
              const pageDef = calendarSet.pages[focusPageIndex] ?? calendarSet.pages[0];
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
                      disabled={focusPageIndex === calendarSet.pages.length - 1}
                      onClick={() => setFocusPageIndex((p) => Math.min(calendarSet.pages.length - 1, p + 1))}
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
                    {calendarSet.pages.map((p, i) => (
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
            {calendarSet.pages.map((pageDef) => {
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
