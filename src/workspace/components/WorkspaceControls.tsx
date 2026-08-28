import React from "react";
import { useWorkspaceStore } from "../state/workspaceStore";
import { getWorkspaceHolidayDiagnostics } from "../holiday/holidayWorkspace";
import { HolidayImportControls } from "./HolidayImportControls";
import { HolidayDiagnostics } from "./HolidayDiagnostics";

export const WorkspaceControls: React.FC = () => {
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
          className="field-input"
          style={{
            fontSize: "15px",
            fontWeight: 600,
            width: "220px",
          }}
          aria-label="项目名称"
        />

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="target-year-input" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            目标年份：
          </label>
          <input
            id="target-year-input"
            type="number"
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value) || 2027)}
            className="field-input field-input-number"
            style={{ width: "76px", textAlign: "center" }}
            aria-label="目标年份"
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

