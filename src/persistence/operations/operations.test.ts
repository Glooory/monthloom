import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MonthloomDatabase } from "../db/monthloomDb";
import { ProjectOperations } from "./projectOperations";
import { TemplateOperations } from "./templateOperations";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { useDocumentStore } from "../../editor/state/documentStore";

describe("Project and Template Operations", () => {
  let testDb: MonthloomDatabase;
  let projectOps: ProjectOperations;
  let templateOps: TemplateOperations;

  beforeEach(() => {
    testDb = new MonthloomDatabase(`test-ops-${Date.now()}-${Math.random()}`);
    projectOps = new ProjectOperations(testDb);
    templateOps = new TemplateOperations(testDb);

    useWorkspaceStore.getState().resetWorkspace();
    useDocumentStore.getState().replaceDocument(useDocumentStore.getState().document);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it("saves and loads project with workspace and document state", async () => {
    useWorkspaceStore.getState().setTargetYear(2028);
    useWorkspaceStore.getState().setProjectInfo(null, "2028 Wall Calendar");

    const id = await projectOps.saveCurrentProject();
    expect(id.startsWith("project-")).toBe(true);

    // Reset workspace to defaults
    useWorkspaceStore.getState().resetWorkspace();
    expect(useWorkspaceStore.getState().targetYear).toBe(2027);

    // Load back saved project
    await projectOps.loadProject(id);
    expect(useWorkspaceStore.getState().targetYear).toBe(2028);
    expect(useWorkspaceStore.getState().projectName).toBe("2028 Wall Calendar");
  });

  it("saves and applies template while preserving workspace target year", async () => {
    useWorkspaceStore.getState().setTargetYear(2029);

    const doc = useDocumentStore.getState().document;
    const modifiedDoc = {
      ...doc,
      mainTemplate: {
        ...doc.mainTemplate,
        width: 888,
      },
    };
    useDocumentStore.getState().commitDocument(modifiedDoc);

    const templateId = await templateOps.saveCurrentTemplate("Custom 888 Width");

    // Reset doc
    useDocumentStore.getState().commitDocument(doc);
    expect(useDocumentStore.getState().document.mainTemplate.width).toBe(700);

    // Apply template
    await templateOps.applyTemplate(templateId);
    expect(useDocumentStore.getState().document.mainTemplate.width).toBe(888);
    // Target year should still be 2029
    expect(useWorkspaceStore.getState().targetYear).toBe(2029);

    // Applying template should be undoable
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().document.mainTemplate.width).toBe(700);
  });

  it("refreshes holiday library store immediately upon loading a project without requiring reload", async () => {
    const holidayRepo = projectOps["holidayRepo"];
    await holidayRepo.ensureBuiltins();
    await holidayRepo.upsertCalendar({
      id: "cal-imported-on-load",
      name: "Imported Calendar",
      builtin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const id = await projectOps.saveCurrentProject("Holiday Test Project");

    // Load project and verify holiday store immediately contains the calendar
    await projectOps.loadProject(id);
    const { useHolidayLibraryStore } = await import("../../workspace/state/holidayLibraryStore");
    const snapshot = useHolidayLibraryStore.getState().snapshot;
    expect(snapshot.calendars.map((c) => c.id)).toContain("cal-imported-on-load");
  });

  it("updates active project session in localStorage when saving or loading a project", async () => {
    localStorage.clear();
    const { getActiveProjectId } = await import("../session/projectSession");

    useWorkspaceStore.getState().setTargetYear(2028);
    useWorkspaceStore.getState().setProjectInfo(null, "Session Test Project");

    const savedId = await projectOps.saveCurrentProject();
    expect(getActiveProjectId()).toBe(savedId);

    // Create another project
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().setTargetYear(2030);
    useWorkspaceStore.getState().setProjectInfo(null, "Second Project");
    const secondId = await projectOps.saveCurrentProject();
    expect(getActiveProjectId()).toBe(secondId);

    // Loading first project updates active project id
    await projectOps.loadProject(savedId);
    expect(getActiveProjectId()).toBe(savedId);
  });

  it("handles deleting active project by switching to another project or resetting workspace", async () => {
    localStorage.clear();
    const { getActiveProjectId } = await import("../session/projectSession");

    // Save project 1
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().setTargetYear(2028);
    useWorkspaceStore.getState().setProjectInfo(null, "Project 1");
    const id1 = await projectOps.saveCurrentProject();

    // Save project 2
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().setTargetYear(2029);
    useWorkspaceStore.getState().setProjectInfo(null, "Project 2");
    const id2 = await projectOps.saveCurrentProject();

    expect(getActiveProjectId()).toBe(id2);
    expect(useWorkspaceStore.getState().currentProjectId).toBe(id2);

    // Delete active project (id2): should switch to remaining project (id1)
    await projectOps.deleteProject(id2);
    expect(getActiveProjectId()).toBe(id1);
    expect(useWorkspaceStore.getState().currentProjectId).toBe(id1);
    expect(useWorkspaceStore.getState().projectName).toBe("Project 1");

    // Delete remaining project (id1): no projects left -> resets workspace & clears active project
    await projectOps.deleteProject(id1);
    expect(getActiveProjectId()).toBeNull();
    expect(useWorkspaceStore.getState().currentProjectId).toBeNull();
    expect(useWorkspaceStore.getState().projectName).toBe("未命名项目");
    expect(useWorkspaceStore.getState().targetYear).toBe(2027);
  });

  it("hydrates active project from localStorage when present in DB", async () => {
    localStorage.clear();
    const { setActiveProjectId } = await import("../session/projectSession");

    useWorkspaceStore.getState().setTargetYear(2035);
    useWorkspaceStore.getState().setProjectInfo(null, "Future Calendar 2035");
    const savedId = await projectOps.saveCurrentProject();

    // Reset workspace in-memory
    useWorkspaceStore.getState().resetWorkspace();
    expect(useWorkspaceStore.getState().targetYear).toBe(2027);

    // LocalStorage has savedId
    setActiveProjectId(savedId);

    const hydrated = await projectOps.hydrateActiveProject();
    expect(hydrated.id).toBe(savedId);
    expect(useWorkspaceStore.getState().currentProjectId).toBe(savedId);
    expect(useWorkspaceStore.getState().projectName).toBe("Future Calendar 2035");
    expect(useWorkspaceStore.getState().targetYear).toBe(2035);
  });

  it("falls back to most recently updated project when active project id is missing or not in DB", async () => {
    localStorage.clear();
    const { getActiveProjectId, setActiveProjectId } = await import("../session/projectSession");

    // Create project A
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().setTargetYear(2025);
    useWorkspaceStore.getState().setProjectInfo(null, "Older Project");
    const idA = await projectOps.saveCurrentProject();
    expect(idA).toBeDefined();

    // Small delay to ensure distinct updatedAt
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Create project B (most recent)
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().setTargetYear(2026);
    useWorkspaceStore.getState().setProjectInfo(null, "Newer Project");
    const idB = await projectOps.saveCurrentProject();

    // Reset workspace and set non-existent active ID
    useWorkspaceStore.getState().resetWorkspace();
    setActiveProjectId("non-existent-project-id");

    const hydrated = await projectOps.hydrateActiveProject();
    expect(hydrated.id).toBe(idB);
    expect(getActiveProjectId()).toBe(idB);
    expect(useWorkspaceStore.getState().currentProjectId).toBe(idB);
    expect(useWorkspaceStore.getState().projectName).toBe("Newer Project");
  });

  it("creates and saves an initial default project snapshot when DB is empty", async () => {
    localStorage.clear();
    const { getActiveProjectId } = await import("../session/projectSession");

    const projectsBefore = await projectOps.listProjects();
    expect(projectsBefore.length).toBe(0);

    const hydrated = await projectOps.hydrateActiveProject();
    expect(hydrated.id.startsWith("project-")).toBe(true);
    expect(hydrated.name).toBe("未命名项目");
    expect(hydrated.targetYear).toBe(2027);
    expect(getActiveProjectId()).toBe(hydrated.id);
    expect(useWorkspaceStore.getState().currentProjectId).toBe(hydrated.id);

    const projectsAfter = await projectOps.listProjects();
    expect(projectsAfter.length).toBe(1);
    expect(projectsAfter[0].id).toBe(hydrated.id);
  });

  it("auto-saves with debouncing and can be flushed immediately", async () => {
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().setTargetYear(2028);
    useWorkspaceStore.getState().setProjectInfo(null, "Debounced Project");

    // scheduleAutoSave debounces
    projectOps.scheduleAutoSave(50);
    // Flush immediately before timer expires
    const flushedId = await projectOps.flushAutoSave();
    expect(flushedId).toBeDefined();

    const loaded = await testDb.projects.get(flushedId!);
    expect(loaded?.name).toBe("Debounced Project");
    expect(loaded?.targetYear).toBe(2028);
  });

  it("preserves in-flight workspace project name edits during asynchronous save", async () => {
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().setTargetYear(2028);
    useWorkspaceStore.getState().setProjectInfo(null, "Initial Name");

    // Start saving
    const savePromise = projectOps.saveCurrentProject();

    // While save is in flight, user continues typing
    useWorkspaceStore.getState().setProjectInfo(useWorkspaceStore.getState().currentProjectId, "Initial Name Extended");

    await savePromise;

    // workspaceStore.projectName should not be rolled back to "Initial Name"
    expect(useWorkspaceStore.getState().projectName).toBe("Initial Name Extended");
  });

  it("serializes concurrent save operations without racing", async () => {
    useWorkspaceStore.getState().resetWorkspace();
    useWorkspaceStore.getState().setTargetYear(2028);
    useWorkspaceStore.getState().setProjectInfo(null, "First Save");

    const p1 = projectOps.saveCurrentProject();
    useWorkspaceStore.getState().setProjectInfo(useWorkspaceStore.getState().currentProjectId, "Second Save");
    const p2 = projectOps.saveCurrentProject();

    const [id1, id2] = await Promise.all([p1, p2]);
    expect(id1).toBe(id2);

    const record = await testDb.projects.get(id2);
    expect(record?.name).toBe("Second Save");
  });

  it("locks concurrent hydrateActiveProject calls to avoid creating duplicate default projects", async () => {
    localStorage.clear();

    const [hydrated1, hydrated2] = await Promise.all([
      projectOps.hydrateActiveProject(),
      projectOps.hydrateActiveProject(),
    ]);

    expect(hydrated1.id).toBe(hydrated2.id);

    const projects = await projectOps.listProjects();
    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe(hydrated1.id);
  });

  it("handles errors gracefully in flushAutoSave without throwing unhandled rejections", async () => {
    projectOps.scheduleAutoSave(50);

    // Force repo.save to throw an error
    const originalSave = projectOps["repo"].save;
    projectOps["repo"].save = async () => {
      throw new Error("Disk quota exceeded");
    };

    const result = await projectOps.flushAutoSave();
    expect(result).toBeNull();

    // Restore original save
    projectOps["repo"].save = originalSave;
  });
});
