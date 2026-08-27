import React, { useState } from "react";
import { TemplateEditor } from "../../editor/components/TemplateEditor";
import { PagePreviewSettings } from "../../editor/components/PagePreviewSettings";
import { FullYearPreview } from "../../preview/fullYear/FullYearPreview";
import { FullYearPreviewControls } from "../../preview/fullYear/FullYearPreviewControls";
import { useDocumentStore } from "../../editor/state/documentStore";
import { memoryAssetStore } from "../../editor/assets/memoryAssetStore";
import {
  createPhase5FixtureCalendar,
  PHASE5_FIXTURE_HOLIDAYS_MAP,
  PHASE5_FIXTURE_DIAGNOSTICS,
} from "./fixture";

export const Phase5Verification: React.FC = () => {
  const [targetYear, setTargetYear] = useState<number>(2027);
  const [editingMonth, setEditingMonth] = useState<{ year: number; month: number }>({
    year: 2027,
    month: 5,
  });

  const document = useDocumentStore((s) => s.document);
  const commitDocument = useDocumentStore((s) => s.commitDocument);

  const editorCalendar = createPhase5FixtureCalendar(
    editingMonth.year,
    editingMonth.month,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#020617" }}>
      {/* Header */}
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
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ fontSize: "14px", color: "#38bdf8" }}>
            Monthloom Phase 5 — Full-year Page Preview Verification
          </strong>
          <span style={{ color: "#475569" }}>|</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>Editor Fixture Month:</span>
            <select
              style={{
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid #334155",
                borderRadius: "4px",
                padding: "2px 8px",
                fontSize: "12px",
              }}
              value={`${editingMonth.year}-${editingMonth.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map((v) => parseInt(v, 10));
                setEditingMonth({ year: y, month: m });
              }}
            >
              <option value="2027-5">2027-05 (6 weeks, holidays & workdays)</option>
              <option value="2027-2">2027-02 (5 weeks)</option>
              <option value="2026-2">2026-02 (4 weeks)</option>
              <option value="2027-1">2027-01 (1st Main month)</option>
              <option value="2027-12">2027-12 (12th Main month)</option>
              <option value="2028-1">2028-01 (13th Main month)</option>
            </select>
          </label>
        </div>
      </header>

      {/* 1. Template Editor (Canvas + Inspector) */}
      <section style={{ height: "600px", borderBottom: "2px solid #1e293b" }}>
        <TemplateEditor
          calendar={editorCalendar}
          assetResolver={memoryAssetStore}
        />
      </section>

      {/* 2. Page Preview Settings */}
      <section>
        <PagePreviewSettings
          config={document.pagePreview}
          onChange={(next) => commitDocument({ ...document, pagePreview: next })}
          assetStore={memoryAssetStore}
        />
      </section>

      {/* 3. Full-year Preview Controls */}
      <section>
        <FullYearPreviewControls
          targetYear={targetYear}
          onTargetYearChange={setTargetYear}
        />
      </section>

      {/* 4. Full-year Preview (13 Pages Single Vertical Flow) */}
      <main style={{ flex: 1 }}>
        <FullYearPreview
          targetYear={targetYear}
          holidayIndex={PHASE5_FIXTURE_HOLIDAYS_MAP}
          coverageDiagnostics={PHASE5_FIXTURE_DIAGNOSTICS}
          assetResolver={memoryAssetStore}
        />
      </main>
    </div>
  );
};
