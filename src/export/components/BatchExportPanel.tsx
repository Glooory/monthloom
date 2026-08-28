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

export const BatchExportPanel: React.FC = () => {
  const { t } = useI18n();
  const [exportMode, setExportMode] = useState<ExportMode>("outlined");
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { targetYear } = useWorkspaceStore();
  const { document } = useDocumentStore();
  const holidayLibrary = useHolidayLibraryStore((s) => s.snapshot);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setErrorMsg(null);

    try {
      // 1. Compute holiday index
      const holidayIndex = resolveHolidayIndex({
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

      // 3. Collect merged font requirements across all 28 calendars
      const requirements = collectFormalExportFontRequirements({
        calendarSet,
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

      // 5. Render 28 formal documents
      const renderedDocs = await renderFormalDocuments({
        calendarSet,
        mainTemplate: document.mainTemplate,
        miniTemplate: document.miniTemplate,
        holidayLayers: document.holidayLayers,
        mode: exportMode,
        fontEngine,
        assetResolver: persistentAssetStore,
      });

      // 6. Package and download ZIP
      const zipBlob = await createFormalExportZip({ documents: renderedDocs });
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
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
        disabled={isExporting}
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
        {t.export.summaryNotice(targetYear)}
      </div>
    </div>
  );
};
