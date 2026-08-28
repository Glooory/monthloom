import React from "react";
import { useWorkspaceStore } from "../state/workspaceStore";
import { getWorkspaceHolidayDiagnostics } from "../holiday/holidayWorkspace";
import { HolidayImportControls } from "./HolidayImportControls";
import { HolidayDiagnostics } from "./HolidayDiagnostics";
import { useI18n } from "../../shared/i18n/i18nStore";

export const WorkspaceControls: React.FC = () => {
  const { t } = useI18n();
  const {
    projectName,
    targetYear,
    chinaHolidayDataset,
    japanHolidayDataset,
    setProjectInfo,
    setTargetYear,
    setChinaHolidayDataset,
    setJapanHolidayDataset,
    currentProjectId,
  } = useWorkspaceStore();

  const diagnostics = getWorkspaceHolidayDiagnostics({
    targetYear,
    chinaHolidayDataset,
    japanHolidayDataset,
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <label htmlFor="target-year-input" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
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

      <HolidayImportControls
        chinaDataset={chinaHolidayDataset}
        japanDataset={japanHolidayDataset}
        onImportChina={setChinaHolidayDataset}
        onImportJapan={setJapanHolidayDataset}
      />

      <HolidayDiagnostics diagnostics={diagnostics} />
    </div>
  );
};

