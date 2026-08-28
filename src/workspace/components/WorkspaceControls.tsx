import React, { useState } from "react";
import { useWorkspaceStore } from "../state/workspaceStore";
import { useDocumentStore } from "../../editor/state/documentStore";
import { useHolidayLibraryStore } from "../state/holidayLibraryStore";
import { getWorkspaceHolidayDiagnostics } from "../holiday/holidayWorkspace";
import { HolidayDiagnostics } from "./HolidayDiagnostics";
import { HolidayLibraryPanel } from "./HolidayLibraryPanel";
import { useI18n } from "../../shared/i18n/i18nStore";

export const WorkspaceControls: React.FC = () => {
  const { t } = useI18n();
  const {
    projectName,
    targetYear,
    setProjectInfo,
    setTargetYear,
    currentProjectId,
  } = useWorkspaceStore();

  const document = useDocumentStore((s) => s.document);
  const holidayLibrary = useHolidayLibraryStore((s) => s.snapshot);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  const diagnostics = getWorkspaceHolidayDiagnostics({
    targetYear,
    library: holidayLibrary,
    layers: document.holidayLayers ?? [],
  });

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectInfo(currentProjectId, e.target.value)}
          placeholder={t.nav.projectPlaceholder}
          className="field-input"
          style={{
            fontSize: "15px",
            fontWeight: 600,
            width: "220px",
          }}
          aria-label={t.workspace.projectNameLabel}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            htmlFor="target-year-input"
            style={{ fontSize: "12px", color: "var(--text-secondary)" }}
          >
            {t.workspace.targetYearLabel}
          </label>
          <input
            id="target-year-input"
            type="number"
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value) || 2027)}
            className="field-input field-input-number"
            style={{ width: "76px", textAlign: "center" }}
            aria-label={t.workspace.targetYearLabel}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setShowLibraryModal(true)}
          className="studio-btn studio-btn-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flex: 1,
            justifyContent: "center",
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {t.workspace.holidayLibraryBtn(holidayLibrary.calendars.length)}
        </button>
      </div>


      <HolidayDiagnostics diagnostics={diagnostics} />

      <HolidayLibraryPanel
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        targetYear={targetYear}
        activeDocument={document}
      />
    </div>
  );
};
