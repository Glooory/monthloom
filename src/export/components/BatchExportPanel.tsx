import React, { useState } from "react";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { useDocumentStore } from "../../editor/state/documentStore";
import { computeWorkspaceHolidayIndex } from "../../workspace/holiday/holidayWorkspace";
import { createFormalExportCalendarSet } from "../formal/monthSet";
import { collectFormalExportFontRequirements } from "../formal/fontRequirements";
import { resolveFontEngine } from "../../resources/fonts/resolveFonts";
import { renderFormalDocuments } from "../formal/renderFormalDocuments";
import { createFormalExportZip, downloadExportZip } from "../formal/createExportZip";
import { persistentAssetStore } from "../../editor/assets/persistentAssetStore";
import { useI18n } from "../../shared/i18n/i18nStore";
import type { ExportMode } from "../formal/types";

export const BatchExportPanel: React.FC = () => {
  const { t } = useI18n();
  const [exportMode, setExportMode] = useState<ExportMode>("outlined");
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { targetYear, chinaHolidayDataset, japanHolidayDataset } = useWorkspaceStore();
  const { document } = useDocumentStore();

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setErrorMsg(null);

    try {
      // 1. Compute holiday index
      const holidayIndex = computeWorkspaceHolidayIndex({
        chinaHolidayDataset,
        japanHolidayDataset,
      });

      // 2. Create 13 Main + 15 Mini formal calendars
      const calendarSet = createFormalExportCalendarSet({
        targetYear,
        holidayIndex,
      });

      // 3. Collect merged font requirements across all 28 calendars
      const requirements = collectFormalExportFontRequirements({
        calendarSet,
        mainTemplate: document.mainTemplate,
        miniTemplate: document.miniTemplate,
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
      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {t.export.heading}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "10px 12px",
            background: exportMode === "outlined" ? "var(--accent-primary-light)" : "var(--bg-surface-raised)",
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
            <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px" }}>
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
            background: exportMode === "editable" ? "var(--accent-primary-light)" : "var(--bg-surface-raised)",
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
            <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px" }}>
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
            backgroundColor: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {t.export.exportFailed(errorMsg)}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "4px" }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="studio-btn studio-btn-primary"
          style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 600 }}
        >
          {isExporting ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {t.export.exportBtnLoading}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="8 17 12 21 16 17" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
              </svg>
              {t.export.exportBtnNormal}
            </>
          )}
        </button>

        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {t.export.summaryNotice(targetYear)}
        </span>
      </div>
    </div>
  );
};

