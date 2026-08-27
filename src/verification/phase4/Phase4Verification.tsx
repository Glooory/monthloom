import React, { useState } from "react";
import { TemplateEditor } from "../../editor/components/TemplateEditor";
import { createPhase4FixtureCalendar } from "./fixture";

export const Phase4Verification: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>({
    year: 2027,
    month: 5,
  });

  const calendar = createPhase4FixtureCalendar(selectedMonth.year, selectedMonth.month);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: "#090d16",
          color: "#f8fafc",
          borderBottom: "1px solid #1e293b",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ fontSize: "14px", color: "#60a5fa" }}>
            Monthloom Phase 4 — Template Editor Verification
          </strong>
          <span style={{ color: "#64748b" }}>|</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>Month Fixture:</span>
            <select
              style={{
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid #334155",
                borderRadius: "4px",
                padding: "2px 8px",
                fontSize: "12px",
              }}
              value={`${selectedMonth.year}-${selectedMonth.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map((v) => parseInt(v, 10));
                setSelectedMonth({ year: y, month: m });
              }}
            >
              <option value="2027-5">2027-05 (6 weeks, holidays & workdays)</option>
              <option value="2027-2">2027-02 (5 weeks)</option>
              <option value="2026-2">2026-02 (4 weeks)</option>
            </select>
          </label>
        </div>
      </header>

      <main style={{ flex: 1, minHeight: 0 }}>
        <TemplateEditor calendar={calendar} />
      </main>
    </div>
  );
};
