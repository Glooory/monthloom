import { ProjectRepository } from "../db/projectRepository";
import { HolidayLibraryRepository } from "../db/holidayLibraryRepository";
import { db as defaultDb, type MonthloomDatabase } from "../db/monthloomDb";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { useDocumentStore } from "../../editor/state/documentStore";
import { useHolidayLibraryStore } from "../../workspace/state/holidayLibraryStore";
import type { ProjectSnapshotV1 } from "../schema/projectSnapshot";

export class ProjectOperations {
  private repo: ProjectRepository;
  private holidayRepo: HolidayLibraryRepository;

  constructor(customDb?: MonthloomDatabase) {
    const db = customDb ?? defaultDb;
    this.repo = new ProjectRepository(db);
    this.holidayRepo = new HolidayLibraryRepository(db);
  }


  async saveCurrentProject(customName?: string): Promise<string> {
    const workspace = useWorkspaceStore.getState();
    const document = useDocumentStore.getState().document;

    const projectId =
      workspace.currentProjectId || `project-${crypto.randomUUID()}`;
    const name =
      customName?.trim() || workspace.projectName || "Untitled Project";
    const now = new Date().toISOString();

    const snapshot: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: projectId,
      name,
      createdAt: now,
      updatedAt: now,
      targetYear: workspace.targetYear,
      document,
    };

    await this.repo.save(snapshot);
    workspace.setProjectInfo(projectId, name);
    return projectId;
  }

  async loadProject(id: string): Promise<void> {
    const project = await this.repo.getById(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    await useHolidayLibraryStore.getState().refresh(this.holidayRepo);

    useWorkspaceStore.getState().loadWorkspace({
      projectId: project.id,
      projectName: project.name,
      targetYear: project.targetYear,
    });

    useDocumentStore.getState().replaceDocument(project.document);
  }


  async listProjects() {
    return this.repo.list();
  }

  async deleteProject(id: string): Promise<void> {
    await this.repo.delete(id);
    const workspace = useWorkspaceStore.getState();
    if (workspace.currentProjectId === id) {
      workspace.setProjectInfo(null, "Untitled Project");
    }
  }
}

export const projectOperations = new ProjectOperations();
