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
import { useI18n } from "../shared/i18n/i18nStore";

export const App: React.FC = () => {
  const { t, locale, toggleLocale } = useI18n();
  const {
    projectName,
    targetYear,
    chinaHolidayDataset,
    japanHolidayDataset,
    setProjectInfo,
    setTargetYear,
    currentProjectId,
  } = useWorkspaceStore();

  const [activeView, setActiveView] = useState<"editor" | "gallery" | "workspace">("editor");

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
      <div className="monthloom-header-left">
        <div className="monthloom-brand" onClick={() => setActiveView("editor")}>
          <div className="monthloom-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span className="monthloom-logo">Monthloom</span>
          <span className="monthloom-brand-badge">{t.nav.brandSubtitle}</span>
        </div>

        <div className="monthloom-project-meta">
          <input
            type="text"
            className="monthloom-project-name-input"
            value={projectName}
            onChange={(e) => setProjectInfo(currentProjectId, e.target.value)}
            placeholder={t.nav.projectPlaceholder}
            aria-label={t.nav.projectNameAria}
          />
          <div className="monthloom-year-badge">
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{t.nav.targetYearLabel}：</span>
            <input
              type="number"
              className="monthloom-year-input"
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value) || 2027)}
              aria-label={t.nav.targetYearAria}
            />
          </div>
        </div>
      </div>

      {/* Center View Mode Switcher */}
      <div className="monthloom-view-nav">
        <button
          type="button"
          className={`monthloom-nav-tab ${activeView === "editor" ? "active" : ""}`}
          onClick={() => setActiveView("editor")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          {t.nav.templateEditorTab}
        </button>
        <button
          type="button"
          className={`monthloom-nav-tab ${activeView === "gallery" ? "active" : ""}`}
          onClick={() => setActiveView("gallery")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          {t.nav.fullYearGalleryTab}
        </button>
        <button
          type="button"
          className={`monthloom-nav-tab ${activeView === "workspace" ? "active" : ""}`}
          onClick={() => setActiveView("workspace")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {t.nav.workspaceTab}
        </button>
      </div>

      {/* Right Action Bar */}
      <div className="monthloom-header-right">
        {activeView === "editor" && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>{t.nav.previewMonthLabel}：</span>
            <select
              className="field-input"
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                width: "auto",
                cursor: "pointer",
              }}
              value={`${editingMonth.year}-${editingMonth.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map((v) => parseInt(v, 10));
                setEditingMonth({ year: y, month: m });
              }}
            >
              <option value={`${targetYear}-1`}>{t.nav.monthOptions.mainFirst(targetYear)}</option>
              <option value={`${targetYear}-5`}>{t.nav.monthOptions.mainMonth(targetYear, 5)}</option>
              <option value={`${targetYear}-12`}>{t.nav.monthOptions.mainLast(targetYear)}</option>
              <option value={`${targetYear + 1}-1`}>{t.nav.monthOptions.mainNextYearFirst(targetYear)}</option>
              <option value={`${targetYear - 1}-12`}>{t.nav.monthOptions.miniPrevYearLast(targetYear)}</option>
              <option value={`${targetYear + 1}-2`}>{t.nav.monthOptions.miniNextYearSecond(targetYear)}</option>
            </select>
          </label>
        )}

        {/* Language Switcher */}
        <button
          type="button"
          className="studio-btn studio-btn-secondary"
          onClick={toggleLocale}
          title={locale === "zh" ? "Switch to English" : "切换为中文"}
          style={{
            minWidth: "48px",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "12px",
          }}
          data-testid="language-toggle-btn"
        >
          {locale === "zh" ? "EN" : "中"}
        </button>

        <button
          type="button"
          className="studio-btn studio-btn-secondary"
          onClick={() => setActiveView("workspace")}
          title={t.nav.quickManageProject}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
          </svg>
          {t.nav.quickManageProject}
        </button>

        <button
          type="button"
          className="studio-btn studio-btn-accent"
          onClick={() => setActiveView("workspace")}
          title={t.nav.quickExport}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="8 17 12 21 16 17" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
          </svg>
          {t.nav.quickExport}
        </button>
      </div>
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
      activeView={activeView}
      controls={controls}
      editor={editor}
      pageSettings={pageSettings}
      preview={preview}
    />
  );
};

