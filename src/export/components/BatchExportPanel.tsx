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
import type { ExportMode } from "../formal/types";

export const BatchExportPanel: React.FC = () => {
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
        gap: "12px",
        padding: "16px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: "14px", color: "#1F2937" }}>
        Formal Batch SVG Export
      </div>

      <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#374151" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="radio"
            name="exportMode"
            value="outlined"
            checked={exportMode === "outlined"}
            onChange={() => setExportMode("outlined")}
          />
          Outlined (Vector Paths, Self-contained)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input
            type="radio"
            name="exportMode"
            value="editable"
            checked={exportMode === "editable"}
            onChange={() => setExportMode("editable")}
          />
          Editable (&lt;text&gt; Elements)
        </label>
      </div>

      {errorMsg && (
        <div style={{ fontSize: "12px", color: "#DC2626", backgroundColor: "#FEE2E2", padding: "6px 10px", borderRadius: "4px" }}>
          Export Error: {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 600,
            background: isExporting ? "#93C5FD" : "#2563EB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            cursor: isExporting ? "not-allowed" : "pointer",
          }}
        >
          {isExporting ? "Exporting..." : "Export 28 SVGs"}
        </button>
        <span style={{ fontSize: "12px", color: "#6B7280" }}>
          Target Year: {targetYear} (13 Main + 15 Mini)
        </span>
      </div>
    </div>
  );
};
