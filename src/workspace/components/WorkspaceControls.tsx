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
        gap: "12px",
        padding: "16px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectInfo(currentProjectId, e.target.value)}
          style={{
            fontSize: "16px",
            fontWeight: 600,
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            padding: "4px 8px",
            width: "220px",
          }}
          aria-label="Project Name"
        />

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label htmlFor="target-year-input" style={{ fontSize: "12px", color: "#4B5563" }}>
            Target Year:
          </label>
          <input
            id="target-year-input"
            type="number"
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value) || 2027)}
            style={{
              width: "70px",
              padding: "4px 6px",
              fontSize: "13px",
              border: "1px solid #D1D5DB",
              borderRadius: "4px",
            }}
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
