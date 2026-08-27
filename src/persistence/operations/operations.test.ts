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
});
