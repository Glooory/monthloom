import React, { useState, useEffect, useRef } from "react";
import { projectOperations } from "../operations/projectOperations";
import { templateOperations } from "../operations/templateOperations";
import { createMonthloomBundle } from "../bundle/exportBundle";
import { importMonthloomBundle } from "../bundle/importBundle";
import { ProjectRepository } from "../db/projectRepository";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { useI18n } from "../../shared/i18n/i18nStore";

export const PersistenceControls: React.FC = () => {
  const { t } = useI18n();
  const [projectList, setProjectList] = useState<Array<{ id: string; name: string; targetYear: number; updatedAt: string }>>([]);
  const [templateList, setTemplateList] = useState<Array<{ id: string; name: string; updatedAt: string }>>([]);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const bundleInputRef = useRef<HTMLInputElement>(null);

  const reloadLists = async () => {
    try {
      const projects = await projectOperations.listProjects();
      setProjectList(projects);
      const templates = await templateOperations.listTemplates();
      setTemplateList(templates);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    reloadLists();
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveProject = async () => {
    try {
      await projectOperations.saveCurrentProject();
      await reloadLists();
      showStatus(t.persistence.saveProjectSuccess);
    } catch (err) {
      showStatus(t.persistence.saveProjectError(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleLoadProject = async (id: string) => {
    try {
      await projectOperations.loadProject(id);
      setShowProjectsModal(false);
      showStatus(t.persistence.loadProjectSuccess);
    } catch (err) {
      showStatus(t.persistence.loadProjectError(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm(t.persistence.deleteProjectConfirm)) return;
    try {
      await projectOperations.deleteProject(id);
      await reloadLists();
      showStatus(t.persistence.deleteProjectSuccess);
    } catch (err) {
      showStatus(t.persistence.deleteProjectError(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateNameInput.trim()) return;
    try {
      await templateOperations.saveCurrentTemplate(templateNameInput.trim());
      setTemplateNameInput("");
      await reloadLists();
      showStatus(t.persistence.saveTemplateSuccess);
    } catch (err) {
      showStatus(t.persistence.saveTemplateError(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleApplyTemplate = async (id: string) => {
    try {
      await templateOperations.applyTemplate(id);
      setShowTemplatesModal(false);
      showStatus(t.persistence.applyTemplateSuccess);
    } catch (err) {
      showStatus(t.persistence.applyTemplateError(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(t.persistence.deleteTemplateConfirm)) return;
    try {
      await templateOperations.deleteTemplate(id);
      await reloadLists();
      showStatus(t.persistence.deleteTemplateSuccess);
    } catch (err) {
      showStatus(t.persistence.deleteTemplateError(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleExportProjectBundle = async () => {
    try {
      const currentId = useWorkspaceStore.getState().currentProjectId;
      const repo = new ProjectRepository();
      let snapshot = currentId ? await repo.getById(currentId) : null;
      if (!snapshot) {
        // Save first
        const newId = await projectOperations.saveCurrentProject();
        snapshot = await repo.getById(newId);
      }
      if (!snapshot) return;

      const blob = await createMonthloomBundle({ snapshot });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${snapshot.name.toLowerCase().replace(/\s+/g, "-")}.monthloom`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus(t.persistence.exportBundleSuccess);
    } catch (err) {
      showStatus(t.persistence.exportBundleError(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleImportBundleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importMonthloomBundle({ bundleData: file });
      await reloadLists();
      if (result.type === "project") {
        await projectOperations.loadProject(result.id);
        showStatus(t.persistence.importProjectSuccess(result.name));
      } else {
        showStatus(t.persistence.importTemplateSuccess(result.name));
      }
    } catch (err) {
      showStatus(t.persistence.importBundleError(err instanceof Error ? err.message : String(err)));
    }
    e.target.value = "";
  };

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
        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {t.persistence.heading}
        </div>
        {statusMessage && (
          <div style={{ fontSize: "12px", color: "var(--accent-emerald)", fontWeight: 500 }}>
            {statusMessage}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleSaveProject}
          className="studio-btn studio-btn-primary"
        >
          {t.persistence.saveProjectBtn}
        </button>

        <button
          type="button"
          onClick={() => {
            reloadLists();
            setShowProjectsModal(true);
          }}
          className="studio-btn studio-btn-secondary"
        >
          {t.persistence.openProjectsBtn(projectList.length)}
        </button>

        <button
          type="button"
          onClick={() => {
            reloadLists();
            setShowTemplatesModal(true);
          }}
          className="studio-btn studio-btn-secondary"
        >
          {t.persistence.templateLibraryBtn(templateList.length)}
        </button>

        <button
          type="button"
          onClick={handleExportProjectBundle}
          className="studio-btn studio-btn-secondary"
        >
          {t.persistence.exportBundleBtn}
        </button>

        <input
          ref={bundleInputRef}
          type="file"
          accept=".monthloom,.zip"
          style={{ display: "none" }}
          onChange={handleImportBundleFile}
        />
        <button
          type="button"
          onClick={() => bundleInputRef.current?.click()}
          className="studio-btn studio-btn-secondary"
        >
          {t.persistence.importBundleBtn}
        </button>
      </div>

      {/* Save Template inline */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
        <input
          type="text"
          placeholder={t.persistence.templateNamePlaceholder}
          value={templateNameInput}
          onChange={(e) => setTemplateNameInput(e.target.value)}
          className="field-input"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={handleSaveTemplate}
          className="studio-btn studio-btn-secondary"
        >
          {t.persistence.saveTemplateBtn}
        </button>
      </div>

      {/* Projects Modal */}
      {showProjectsModal && (
        <div
          className="monthloom-modal-backdrop"
          onClick={() => setShowProjectsModal(false)}
        >
          <div
            className="monthloom-modal"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="monthloom-modal-header">
              <div className="monthloom-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {t.persistence.projectsModalTitle}
              </div>
              <button
                type="button"
                className="monthloom-modal-close"
                onClick={() => setShowProjectsModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="monthloom-modal-body">
              {projectList.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                  {t.persistence.noProjectsText}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {projectList.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "var(--bg-surface-raised)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>{p.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {t.persistence.projectYearAndDate(p.targetYear, new Date(p.updatedAt).toLocaleDateString())}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleLoadProject(p.id)}
                          className="studio-btn studio-btn-primary"
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                        >
                          {t.persistence.loadBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id)}
                          className="studio-btn"
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            color: "var(--accent-rose)",
                            background: "transparent",
                            borderColor: "rgba(244, 63, 94, 0.3)",
                          }}
                        >
                          {t.persistence.deleteBtn}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div
          className="monthloom-modal-backdrop"
          onClick={() => setShowTemplatesModal(false)}
        >
          <div
            className="monthloom-modal"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="monthloom-modal-header">
              <div className="monthloom-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                {t.persistence.templatesModalTitle}
              </div>
              <button
                type="button"
                className="monthloom-modal-close"
                onClick={() => setShowTemplatesModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="monthloom-modal-body">
              {templateList.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                  {t.persistence.noTemplatesText}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {templateList.map((tItem) => (
                    <div
                      key={tItem.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "var(--bg-surface-raised)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>{tItem.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {t.persistence.templateSavedAt(new Date(tItem.updatedAt).toLocaleDateString())}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tItem.id)}
                          className="studio-btn studio-btn-accent"
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                        >
                          {t.persistence.applyBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tItem.id)}
                          className="studio-btn"
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            color: "var(--accent-rose)",
                            background: "transparent",
                            borderColor: "rgba(244, 63, 94, 0.3)",
                          }}
                        >
                          {t.persistence.deleteBtn}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
