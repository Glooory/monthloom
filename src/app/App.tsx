import React, { useState } from "react";
import { AppShell } from "./AppShell";
import { TemplateEditor } from "../editor/components/TemplateEditor";
import { PagePreviewSettings } from "../editor/components/PagePreviewSettings";
import { FullYearPreview } from "../preview/fullYear/FullYearPreview";
import { useDocumentStore } from "../editor/state/documentStore";
import { useWorkspaceStore } from "../workspace/state/workspaceStore";
import { persistentAssetStore } from "../editor/assets/persistentAssetStore";
import { WorkspaceControls } from "../workspace/components/WorkspaceControls";
import { PersistenceControls } from "../persistence/components/PersistenceControls";
import { BatchExportPanel } from "../export/components/BatchExportPanel";
import {
  computeWorkspaceHolidayIndex,
  getWorkspaceHolidayDiagnostics,
} from "../workspace/holiday/holidayWorkspace";
import { generateCalendarMonth } from "../domain/calendar/generateCalendarMonth";

export const App: React.FC = () => {
  const { targetYear, chinaHolidayDataset, japanHolidayDataset } = useWorkspaceStore();
  const [editingMonth, setEditingMonth] = useState<{ year: number; month: number }>({
    year: targetYear,
    month: 5,
  });

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

  const header = (
    <>
      <div className="monthloom-header-title">
        <span className="monthloom-logo">Monthloom</span>
        <span className="monthloom-header-meta">
          Target Year: <strong>{targetYear}</strong> | 13-Page Vertical Calendar
        </span>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px" }}>
        <span style={{ color: "#94A3B8" }}>Editor Preview Month:</span>
        <select
          style={{
            background: "#1E293B",
            color: "#F1F5F9",
            border: "1px solid #334155",
            borderRadius: "4px",
            padding: "4px 10px",
            fontSize: "12px",
          }}
          value={`${editingMonth.year}-${editingMonth.month}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-").map((v) => parseInt(v, 10));
            setEditingMonth({ year: y, month: m });
          }}
        >
          <option value={`${targetYear}-1`}>{targetYear}-01 (1st Main Month)</option>
          <option value={`${targetYear}-5`}>{targetYear}-05 (Main Month)</option>
          <option value={`${targetYear}-12`}>{targetYear}-12 (12th Main Month)</option>
          <option value={`${targetYear + 1}-1`}>{targetYear + 1}-01 (13th Main Month)</option>
          <option value={`${targetYear - 1}-12`}>{targetYear - 1}-12 (1st Mini Month)</option>
          <option value={`${targetYear + 1}-2`}>{targetYear + 1}-02 (15th Mini Month)</option>
        </select>
      </label>
    </>
  );

  const controls = (
    <>
      <WorkspaceControls />
      <PersistenceControls />
      <BatchExportPanel />
    </>
  );

  const editor = (
    <TemplateEditor
      calendar={editorCalendar}
      assetResolver={persistentAssetStore}
    />
  );

  const pageSettings = (
    <PagePreviewSettings
      config={document.pagePreview}
      onChange={(next) => commitDocument({ ...document, pagePreview: next })}
      assetStore={persistentAssetStore}
    />
  );

  const preview = (
    <FullYearPreview
      targetYear={targetYear}
      holidayIndex={holidayIndex}
      coverageDiagnostics={diagnostics}
      assetResolver={persistentAssetStore}
    />
  );

  return (
    <AppShell
      header={header}
      controls={controls}
      editor={editor}
      pageSettings={pageSettings}
      preview={preview}
    />
  );
};
