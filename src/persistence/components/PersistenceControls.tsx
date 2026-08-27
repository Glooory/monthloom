import React, { useState, useEffect, useRef } from "react";
import { projectOperations } from "../operations/projectOperations";
import { templateOperations } from "../operations/templateOperations";
import { createMonthloomBundle } from "../bundle/exportBundle";
import { importMonthloomBundle } from "../bundle/importBundle";
import { ProjectRepository } from "../db/projectRepository";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";

export const PersistenceControls: React.FC = () => {
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
      showStatus("Project saved successfully!");
    } catch (err) {
      showStatus(`Error saving project: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleLoadProject = async (id: string) => {
    try {
      await projectOperations.loadProject(id);
      setShowProjectsModal(false);
      showStatus("Project loaded!");
    } catch (err) {
      showStatus(`Error loading project: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await projectOperations.deleteProject(id);
      await reloadLists();
      showStatus("Project deleted.");
    } catch (err) {
      showStatus(`Error deleting project: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateNameInput.trim()) return;
    try {
      await templateOperations.saveCurrentTemplate(templateNameInput.trim());
      setTemplateNameInput("");
      await reloadLists();
      showStatus("Template saved!");
    } catch (err) {
      showStatus(`Error saving template: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleApplyTemplate = async (id: string) => {
    try {
      await templateOperations.applyTemplate(id);
      setShowTemplatesModal(false);
      showStatus("Template applied!");
    } catch (err) {
      showStatus(`Error applying template: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await templateOperations.deleteTemplate(id);
      await reloadLists();
      showStatus("Template deleted.");
    } catch (err) {
      showStatus(`Error deleting template: ${err instanceof Error ? err.message : String(err)}`);
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
      showStatus("Exported .monthloom bundle!");
    } catch (err) {
      showStatus(`Error exporting bundle: ${err instanceof Error ? err.message : String(err)}`);
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
        showStatus(`Imported and loaded project: ${result.name}`);
      } else {
        showStatus(`Imported template: ${result.name}`);
      }
    } catch (err) {
      showStatus(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    e.target.value = "";
  };

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
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#1F2937" }}>
          Projects & Templates
        </div>
        {statusMessage && (
          <div style={{ fontSize: "12px", color: "#059669", fontWeight: 500 }}>
            {statusMessage}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleSaveProject}
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            fontWeight: 500,
            background: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save Project
        </button>

        <button
          type="button"
          onClick={() => {
            reloadLists();
            setShowProjectsModal(true);
          }}
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            background: "#F3F4F6",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Open Project ({projectList.length})
        </button>

        <button
          type="button"
          onClick={() => {
            reloadLists();
            setShowTemplatesModal(true);
          }}
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            background: "#F3F4F6",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Templates ({templateList.length})
        </button>

        <button
          type="button"
          onClick={handleExportProjectBundle}
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            background: "#F3F4F6",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Export .monthloom
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
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            background: "#F3F4F6",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Import .monthloom
        </button>
      </div>

      {/* Save Template inline */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
        <input
          type="text"
          placeholder="New template name..."
          value={templateNameInput}
          onChange={(e) => setTemplateNameInput(e.target.value)}
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            flex: 1,
          }}
        />
        <button
          type="button"
          onClick={handleSaveTemplate}
          style={{
            padding: "4px 10px",
            fontSize: "12px",
            background: "#F3F4F6",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save as Template
        </button>
      </div>

      {/* Projects Modal */}
      {showProjectsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowProjectsModal(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              padding: "20px",
              width: "420px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "16px" }}>Saved Projects</div>
              <button
                type="button"
                onClick={() => setShowProjectsModal(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>
            {projectList.length === 0 ? (
              <div style={{ color: "#6B7280", fontSize: "13px" }}>No saved projects yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {projectList.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "14px" }}>{p.name}</div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        Year: {p.targetYear} • {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleLoadProject(p.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          background: "#2563EB",
                          color: "#FFF",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          color: "#DC2626",
                          background: "transparent",
                          border: "1px solid #FCA5A5",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowTemplatesModal(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              padding: "20px",
              width: "420px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "16px" }}>Reusable Templates</div>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>
            {templateList.length === 0 ? (
              <div style={{ color: "#6B7280", fontSize: "13px" }}>No saved templates yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {templateList.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "14px" }}>{t.name}</div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        Saved: {new Date(t.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(t.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          background: "#059669",
                          color: "#FFF",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(t.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          color: "#DC2626",
                          background: "transparent",
                          border: "1px solid #FCA5A5",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
