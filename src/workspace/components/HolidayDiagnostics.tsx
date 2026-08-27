import React from "react";
import type { HolidayDiagnostic } from "../../domain/holiday/types";

export type HolidayDiagnosticsProps = {
  diagnostics: readonly HolidayDiagnostic[];
};

export const HolidayDiagnostics: React.FC<HolidayDiagnosticsProps> = ({
  diagnostics,
}) => {
  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "8px 12px",
        backgroundColor: "#FEF3C7",
        border: "1px solid #F59E0B",
        borderRadius: "6px",
        fontSize: "12px",
        color: "#92400E",
      }}
    >
      <div style={{ fontWeight: 600 }}>Holiday Diagnostics & Coverage</div>
      <ul style={{ margin: 0, paddingLeft: "16px" }}>
        {diagnostics.map((d, i) => (
          <li key={i} style={{ color: d.level === "error" ? "#B91C1C" : "#92400E" }}>
            {d.message}
          </li>
        ))}
      </ul>
    </div>
  );
};
