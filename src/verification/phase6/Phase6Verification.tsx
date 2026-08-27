import React, { useState } from "react";
import { TemplateEditor } from "../../editor/components/TemplateEditor";
import { PagePreviewSettings } from "../../editor/components/PagePreviewSettings";
import { FullYearPreview } from "../../preview/fullYear/FullYearPreview";
import { useDocumentStore } from "../../editor/state/documentStore";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { persistentAssetStore } from "../../editor/assets/persistentAssetStore";
import { WorkspaceControls } from "../../workspace/components/WorkspaceControls";
import { PersistenceControls } from "../../persistence/components/PersistenceControls";
import { BatchExportPanel } from "../../export/components/BatchExportPanel";
import {
  computeWorkspaceHolidayIndex,
  getWorkspaceHolidayDiagnostics,
} from "../../workspace/holiday/holidayWorkspace";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";

export const Phase6Verification: React.FC = () => {
  const [editingMonth, setEditingMonth] = useState<{ year: number; month: number }>({
    year: 2027,
    month: 5,
  });

  const { targetYear, chinaHolidayDataset, japanHolidayDataset } = useWorkspaceStore();
  const document = useDocumentStore((s) => s.document);
  const commitDocument = useDocumentStore((s) => s.commitDocument);

  const holidayIndex = computeWorkspaceHolidayIndex({
    chinaHolidayDataset,
    japanHolidayDataset,
  });

  const diagnostics = getWorkspaceHolidayDiagnostics({
    targetYear,
    chinaHolidayDataset,
    japanHolidayDataset,
  });

  const editorCalendar = generateCalendarMonth(
    editingMonth.year,
    editingMonth.month,
    holidayIndex,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#020617", color: "#F8FAFC" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#090D16",
          borderBottom: "1px solid #1E293B",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <strong style={{ fontSize: "15px", color: "#38BDF8" }}>
            Monthloom — Persistence & Formal 28-SVG Batch Export
          </strong>
          <span style={{ color: "#475569" }}>|</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px" }}>
            <span>Editor Preview Month:</span>
            <select
              style={{
                background: "#1E293B",
                color: "#F1F5F9",
                border: "1px solid #334155",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "12px",
              }}
              value={`${editingMonth.year}-${editingMonth.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map((v) => parseInt(v, 10));
                setEditingMonth({ year: y, month: m });
              }}
            >
              <option value={`${targetYear}-5`}>{targetYear}-05 (Main Month)</option>
              <option value={`${targetYear}-1`}>{targetYear}-01 (1st Main Month)</option>
              <option value={`${targetYear}-12`}>{targetYear}-12 (12th Main Month)</option>
              <option value={`${targetYear + 1}-1`}>{targetYear + 1}-01 (13th Main Month)</option>
              <option value={`${targetYear - 1}-12`}>{targetYear - 1}-12 (1st Mini Month)</option>
              <option value={`${targetYear + 1}-2`}>{targetYear + 1}-02 (15th Mini Month)</option>
            </select>
          </label>
        </div>
      </header>

      {/* Control Panels Grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
          padding: "16px 20px",
          background: "#0F172A",
          borderBottom: "1px solid #1E293B",
        }}
      >
        <WorkspaceControls />
        <PersistenceControls />
        <BatchExportPanel />
      </section>

      {/* Template Editor */}
      <section style={{ height: "620px", borderBottom: "2px solid #1E293B" }}>
        <TemplateEditor
          calendar={editorCalendar}
          assetResolver={persistentAssetStore}
        />
      </section>

      {/* Page Preview Settings */}
      <section style={{ padding: "0 20px" }}>
        <PagePreviewSettings
          config={document.pagePreview}
          onChange={(next) => commitDocument({ ...document, pagePreview: next })}
          assetStore={persistentAssetStore}
        />
      </section>

      {/* Full-year 13-Page Live Stream */}
      <main style={{ flex: 1, padding: "20px" }}>
        <FullYearPreview
          targetYear={targetYear}
          holidayIndex={holidayIndex}
          coverageDiagnostics={diagnostics}
          assetResolver={persistentAssetStore}
        />
      </main>
    </div>
  );
};
