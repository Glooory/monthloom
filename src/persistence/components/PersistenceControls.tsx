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
      showStatus("项目保存成功！");
    } catch (err) {
      showStatus(`保存项目失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleLoadProject = async (id: string) => {
    try {
      await projectOperations.loadProject(id);
      setShowProjectsModal(false);
      showStatus("项目加载成功！");
    } catch (err) {
      showStatus(`加载项目失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("确定要删除该项目吗？")) return;
    try {
      await projectOperations.deleteProject(id);
      await reloadLists();
      showStatus("项目已删除。");
    } catch (err) {
      showStatus(`删除项目失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateNameInput.trim()) return;
    try {
      await templateOperations.saveCurrentTemplate(templateNameInput.trim());
      setTemplateNameInput("");
      await reloadLists();
      showStatus("模板保存成功！");
    } catch (err) {
      showStatus(`保存模板失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleApplyTemplate = async (id: string) => {
    try {
      await templateOperations.applyTemplate(id);
      setShowTemplatesModal(false);
      showStatus("模板应用成功！");
    } catch (err) {
      showStatus(`应用模板失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("确定要删除该模板吗？")) return;
    try {
      await templateOperations.deleteTemplate(id);
      await reloadLists();
      showStatus("模板已删除。");
    } catch (err) {
      showStatus(`删除模板失败：${err instanceof Error ? err.message : String(err)}`);
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
      showStatus("已导出 .monthloom 项目包！");
    } catch (err) {
      showStatus(`导出项目包失败：${err instanceof Error ? err.message : String(err)}`);
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
        showStatus(`已导入并加载项目：${result.name}`);
      } else {
        showStatus(`已导入模板：${result.name}`);
      }
    } catch (err) {
      showStatus(`导入失败：${err instanceof Error ? err.message : String(err)}`);
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
          项目与模板
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
          保存项目
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
          打开项目 ({projectList.length})
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
          模板库 ({templateList.length})
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
          导出项目包 (.monthloom)
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
          导入项目包 (.monthloom)
        </button>
      </div>

      {/* Save Template inline */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
        <input
          type="text"
          placeholder="新模板名称..."
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
          存为模板
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
              <div style={{ fontWeight: 600, fontSize: "16px" }}>已保存的项目</div>
              <button
                type="button"
                onClick={() => setShowProjectsModal(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>
            {projectList.length === 0 ? (
              <div style={{ color: "#6B7280", fontSize: "13px" }}>暂无已保存的项目。</div>
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
                        年份：{p.targetYear} • {new Date(p.updatedAt).toLocaleDateString()}
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
                        加载
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
                        删除
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
              <div style={{ fontWeight: 600, fontSize: "16px" }}>模板库</div>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>
            {templateList.length === 0 ? (
              <div style={{ color: "#6B7280", fontSize: "13px" }}>暂无已保存的模板。</div>
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
                        保存于：{new Date(t.updatedAt).toLocaleDateString()}
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
                        应用
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
                        删除
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
