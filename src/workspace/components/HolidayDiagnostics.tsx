import React from "react";
import type { HolidayDiagnostic } from "../../domain/holiday/types";
import { useI18n } from "../../shared/i18n/i18nStore";

export type HolidayDiagnosticsProps = {
  diagnostics: readonly HolidayDiagnostic[];
};

export const HolidayDiagnostics: React.FC<HolidayDiagnosticsProps> = ({
  diagnostics,
}) => {
  const { t } = useI18n();

  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "10px 14px",
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        borderRadius: "var(--radius-md)",
        fontSize: "12px",
        color: "#fde68a",
      }}
    >
      <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-amber)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        {t.workspace.diagnosticsHeading}
      </div>
      <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.5 }}>
        {diagnostics.map((d, i) => (
          <li key={i} style={{ color: d.level === "error" ? "var(--accent-rose)" : "#fde68a" }}>
            {d.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

