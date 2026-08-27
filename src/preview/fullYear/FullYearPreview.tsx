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

  if (error) {
    return (
      <div className="full-year-preview-container">
        <div style={{ color: "#ef4444", padding: 16 }}>
          Failed to render Full-year Preview: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="full-year-preview-container">
      {/* Warning Banners */}
      {(geometry.warnings.length > 0 || coverageDiagnostics.length > 0) && (
        <div className="full-year-page-wrapper">
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
        <div style={{ color: "#94a3b8", padding: 32 }}>Rendering 13 pages...</div>
      )}

      {documents &&
        calendarSet.pages.map((pageDef) => {
          const mainKey = `${pageDef.mainMonth.year}-${pageDef.mainMonth.month}` as const;
          const prevKey = `${pageDef.previousMiniMonth.year}-${pageDef.previousMiniMonth.month}` as const;
          const nextKey = `${pageDef.nextMiniMonth.year}-${pageDef.nextMiniMonth.month}` as const;

          const mainDoc = documents.main.get(mainKey);
          const prevDoc = documents.mini.get(prevKey);
          const nextDoc = documents.mini.get(nextKey);

          if (!mainDoc || !prevDoc || !nextDoc) {
            return null;
          }

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
  );
};
