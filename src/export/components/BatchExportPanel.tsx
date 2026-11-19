import React, { useState } from "react";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { useDocumentStore } from "../../editor/state/documentStore";
import { useHolidayLibraryStore } from "../../workspace/state/holidayLibraryStore";
import { resolveHolidayIndex } from "../../domain/holiday/resolveHolidayIndex";
import { createFormalExportCalendarSet } from "../formal/monthSet";
import { collectFormalExportFontRequirements } from "../formal/fontRequirements";
import { resolveFontEngine } from "../../resources/fonts/resolveFonts";
import { renderFormalDocuments } from "../formal/renderFormalDocuments";
import {
  createFormalExportZip,
  downloadExportZip,
} from "../formal/createExportZip";
import { persistentAssetStore } from "../../editor/assets/persistentAssetStore";
import { useI18n } from "../../shared/i18n/i18nStore";
import type { ExportMode } from "../formal/types";
import { composeFullPageDocuments } from "../formal/composeFullPageDocuments";

export const BatchExportPanel: React.FC = () => {
  const { t } = useI18n();
  const [included, setIncluded] = useState({ main: true, mini: true, fullSvg: true, fullPng: true });
  const [exportMode, setExportMode] = useState<ExportMode>("outlined");
  const [pngScale, setPngScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { targetYear } = useWorkspaceStore();
  const { document } = useDocumentStore();
  const holidayLibrary = useHolidayLibraryStore((s) => s.snapshot);
  const includesSvg = included.main || included.mini || included.fullSvg;
  const includesFullPage = included.fullSvg || included.fullPng;
  const canExport = included.fullPng || includesSvg;

  const handleExport = async () => {
    if (isExporting || !canExport) return;
    setIsExporting(true);
    setErrorMsg(null);

    try {
      // 1. Compute holiday index
      const holidayIndex = resolveHolidayIndex({
        targetYear,
        library: holidayLibrary,
        layers: document.holidayLayers ?? [],
      });

      // 2. Create 13 Main + 15 Mini formal calendars
      const calendarSet = createFormalExportCalendarSet({
        targetYear,
        holidayIndex,
        mainStartOfWeek: document.mainTemplate.weekdayRow.startOfWeek ?? 0,
        miniStartOfWeek: document.miniTemplate.weekdayRow.startOfWeek ?? 0,
      });

      const svgCalendarSet = included.fullSvg ? calendarSet : {
        mainCalendars: included.main ? calendarSet.mainCalendars : new Map(),
        miniCalendars: included.mini ? calendarSet.miniCalendars : new Map(),
      };

      // Full-page composition uses both calendars, even if their SVGs are omitted.
      const requirements = collectFormalExportFontRequirements({
        calendarSet: includesFullPage ? calendarSet : svgCalendarSet,
        mainTemplate: document.mainTemplate,
        miniTemplate: document.miniTemplate,
        holidayLayers: document.holidayLayers,
      });

      // 4. Resolve font engine once for the entire batch
      const fontEngine = await resolveFontEngine({
        catalog: document.fontCatalog,
        requirements,
        assetResolver: persistentAssetStore,
      });

      const renderOptions = {
        mainTemplate: document.mainTemplate,
        miniTemplate: document.miniTemplate,
        holidayLayers: document.holidayLayers,
        fontEngine,
        assetResolver: persistentAssetStore,
      };

      // PNG text is always outlined so browser font availability cannot change the output.
      const pngCalendarDocuments = included.fullPng
        ? await renderFormalDocuments({ ...renderOptions, calendarSet, mode: "outlined" })
        : undefined;
      const fullPngDocuments = pngCalendarDocuments
        ? await composeFullPageDocuments({
            targetYear,
            documents: pngCalendarDocuments,
            pagePreview: document.pagePreview,
            assetResolver: persistentAssetStore,
          })
        : undefined;
      let svgDocuments = exportMode === "outlined" ? pngCalendarDocuments : undefined;
      if (includesSvg && !svgDocuments) {
        svgDocuments = await renderFormalDocuments({
          ...renderOptions,
          calendarSet: svgCalendarSet,
          mode: exportMode,
        });
      }

      const fullSvgDocuments = included.fullSvg && svgDocuments
        ? await composeFullPageDocuments({
            targetYear,
            documents: svgDocuments,
            pagePreview: document.pagePreview,
            includeBackground: false,
          })
        : undefined;

      const zipBlob = await createFormalExportZip({
        documents: {
          main: included.main ? svgDocuments?.main : undefined,
          mini: included.mini ? svgDocuments?.mini : undefined,
        },
        fullDocuments: fullPngDocuments,
        fullSvgDocuments,
        pngScale,
      });
      downloadExportZip(zipBlob, targetYear);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "18px",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: "14px",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {t.export.heading}
      </div>

      <fieldset className="export-contents" disabled={isExporting}>
        <legend className="field-label">{t.export.contents}</legend>
        {(["main", "mini", "fullSvg", "fullPng"] as const).map((kind) => (
          <label key={kind}>
            <input
              type="checkbox"
              checked={included[kind]}
              onChange={(event) => {
                const checked = event.target.checked;
                setIncluded((current) => ({ ...current, [kind]: checked }));
              }}
            />
            {t.export.outputLabels[kind]}
          </label>
        ))}
      </fieldset>

      {included.fullPng && (
        <label className="field-row"><span className="field-label">{t.export.pngScale}</span>
          <select className="field-input" value={pngScale} disabled={isExporting} onChange={(e) => setPngScale(Number(e.target.value))}>
            {[1, 2, 3].map((scale) => <option key={scale} value={scale}>{scale}× · {Math.round(document.pagePreview.layout.width * scale)} × {Math.round(document.pagePreview.layout.height * scale)} px</option>)}
          </select>
        </label>
      )}

      <div className="export-svg-options" hidden={!includesSvg}>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "10px 12px",
            background:
              exportMode === "outlined"
                ? "var(--accent-primary-light)"
                : "var(--bg-surface-raised)",
            border: `1px solid ${exportMode === "outlined" ? "rgba(99, 102, 241, 0.4)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontSize: "12px",
            color: "var(--text-primary)",
            transition: "all 0.15s ease",
          }}
        >
          <input
            type="radio"
            name="exportMode"
            value="outlined"
            checked={exportMode === "outlined"}
            disabled={isExporting}
            onChange={() => setExportMode("outlined")}
            style={{ marginTop: "2px" }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{t.export.outlinedTitle}</div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              {t.export.outlinedDesc}
            </div>
          </div>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "10px 12px",
            background:
              exportMode === "editable"
                ? "var(--accent-primary-light)"
                : "var(--bg-surface-raised)",
            border: `1px solid ${exportMode === "editable" ? "rgba(99, 102, 241, 0.4)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontSize: "12px",
            color: "var(--text-primary)",
            transition: "all 0.15s ease",
          }}
        >
          <input
            type="radio"
            name="exportMode"
            value="editable"
            checked={exportMode === "editable"}
            disabled={isExporting}
            onChange={() => setExportMode("editable")}
            style={{ marginTop: "2px" }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{t.export.editableTitle}</div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              {t.export.editableDesc}
            </div>
          </div>
        </label>
      </div>

      {errorMsg && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--accent-rose)",
            padding: "8px 12px",
            background: "rgba(244, 63, 94, 0.1)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {t.export.exportFailed(errorMsg)}
        </div>
      )}

      <button
        type="button"
        disabled={isExporting || !canExport}
        onClick={handleExport}
        className="studio-btn studio-btn-accent"
        style={{
          padding: "10px",
          fontWeight: 600,
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {isExporting ? (
          <>
            <div
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid white",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            {t.export.exportBtnLoading}
          </>
        ) : (
          <>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t.export.exportBtnNormal}
          </>
        )}
      </button>

      <div
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        {canExport ? t.export.summaryNotice(targetYear) : t.export.selectAtLeastOne}
      </div>
    </div>
  );
};
