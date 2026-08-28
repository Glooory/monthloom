import React, { useState, useMemo } from "react";
import { TemplateEditor } from "../../editor/components/TemplateEditor";
import { PagePreviewSettings } from "../../editor/components/PagePreviewSettings";
import { FullYearPreview } from "../../preview/fullYear/FullYearPreview";
import { useDocumentStore } from "../../editor/state/documentStore";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { useHolidayLibraryStore } from "../../workspace/state/holidayLibraryStore";
import { persistentAssetStore } from "../../editor/assets/persistentAssetStore";
import { WorkspaceControls } from "../../workspace/components/WorkspaceControls";
import { PersistenceControls } from "../../persistence/components/PersistenceControls";
import { BatchExportPanel } from "../../export/components/BatchExportPanel";
import { getWorkspaceHolidayDiagnostics } from "../../workspace/holiday/holidayWorkspace";
import { resolveHolidayIndex } from "../../domain/holiday/resolveHolidayIndex";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";

export const Phase6Verification: React.FC = () => {
  const [editingMonth] = useState<{
    year: number;
    month: number;
  }>({
    year: 2027,
    month: 5,
  });

  const { targetYear } = useWorkspaceStore();
  const document = useDocumentStore((s) => s.document);
  const commitDocument = useDocumentStore((s) => s.commitDocument);
  const holidayLibrary = useHolidayLibraryStore((s) => s.snapshot);

  const holidayIndex = useMemo(
    () =>
      resolveHolidayIndex({
        library: holidayLibrary,
        layers: document.holidayLayers ?? [],
      }),
    [holidayLibrary, document.holidayLayers],
  );

  const diagnostics = useMemo(
    () =>
      getWorkspaceHolidayDiagnostics({
        targetYear,
        library: holidayLibrary,
        layers: document.holidayLayers ?? [],
      }),
    [targetYear, holidayLibrary, document.holidayLayers],
  );

  const editorCalendar = generateCalendarMonth(
    editingMonth.year,
    editingMonth.month,
    holidayIndex,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#020617",
        color: "#F8FAFC",
      }}
    >
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
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
            Monthloom
          </h1>
          <span
            style={{
              background: "#3B82F6",
              color: "#FFF",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
              fontWeight: 600,
            }}
          >
            Phase 6 Full Integration Verification
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: "13px", color: "#94A3B8" }}>
            Target Year:
          </label>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            {targetYear}
          </span>
        </div>
      </header>

      {/* Main Body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr 340px",
          height: "calc(100vh - 55px)",
          overflow: "hidden",
        }}
      >
        {/* Left: Workspace and Export Controls */}
        <aside
          style={{
            borderRight: "1px solid #1E293B",
            background: "#090D16",
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <WorkspaceControls />
          <PersistenceControls />
          <BatchExportPanel />
        </aside>

        {/* Center: Template Editor */}
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#0B1120",
            overflow: "hidden",
          }}
        >
          <TemplateEditor
            calendar={editorCalendar}
            assetResolver={persistentAssetStore}
          />
        </main>

        {/* Right: Page Settings and Preview */}
        <aside
          style={{
            borderLeft: "1px solid #1E293B",
            background: "#090D16",
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <PagePreviewSettings
            config={document.pagePreview}
            onChange={(next) =>
              commitDocument({ ...document, pagePreview: next })
            }
            assetStore={persistentAssetStore}
          />

          <div
            style={{
              borderTop: "1px solid #1E293B",
              paddingTop: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Full Year Preview
            </h3>
            <FullYearPreview
              targetYear={targetYear}
              holidayIndex={holidayIndex}
              coverageDiagnostics={diagnostics}
              assetResolver={persistentAssetStore}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};
