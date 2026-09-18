import { ProjectRepository } from "../db/projectRepository";
import { HolidayLibraryRepository } from "../db/holidayLibraryRepository";
import { db as defaultDb, type MonthloomDatabase } from "../db/monthloomDb";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import {
  useDocumentStore,
  createDefaultEditorDocument,
} from "../../editor/state/documentStore";
import { useHolidayLibraryStore } from "../../workspace/state/holidayLibraryStore";
import type { ProjectSnapshotV1 } from "../schema/projectSnapshot";
import {
  getActiveProjectId,
  setActiveProjectId,
  clearActiveProjectId,
} from "../session/projectSession";

export class ProjectOperations {
  private repo: ProjectRepository;
  private holidayRepo: HolidayLibraryRepository;
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveChain: Promise<unknown> = Promise.resolve();
  private inFlightHydration: Promise<ProjectSnapshotV1> | null = null;

  constructor(customDb?: MonthloomDatabase) {
    const db = customDb ?? defaultDb;
    this.repo = new ProjectRepository(db);
    this.holidayRepo = new HolidayLibraryRepository(db);
  }

  cancelAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  scheduleAutoSave(delayMs = 400): void {
    this.cancelAutoSave();
    this.autoSaveTimer = setTimeout(async () => {
      this.autoSaveTimer = null;
      try {
        await this.saveCurrentProject();
      } catch (err) {
        console.warn("Auto-save failed:", err);
      }
    }, delayMs);
  }

  async flushAutoSave(): Promise<string | null> {
    if (this.autoSaveTimer) {
      this.cancelAutoSave();
      try {
        return await this.saveCurrentProject();
      } catch (err) {
        console.warn("Auto-save flush failed:", err);
        return null;
      }
    }
    return null;
  }

  async saveCurrentProject(customName?: string): Promise<string> {
    this.cancelAutoSave();

    const run = async (): Promise<string> => {
      const workspace = useWorkspaceStore.getState();
      const document = useDocumentStore.getState().document;

      const projectId =
        workspace.currentProjectId || `project-${crypto.randomUUID()}`;
      const name =
        customName?.trim() || workspace.projectName?.trim() || "未命名项目";
      const now = new Date().toISOString();

      let createdAt = now;
      if (workspace.currentProjectId) {
        try {
          const existing = await this.repo.getById(projectId);
          if (existing) {
            createdAt = existing.createdAt;
          }
        } catch {
          // Fallback to now if reading existing record fails
        }
      }

      const snapshot: ProjectSnapshotV1 = {
        version: 1,
        type: "project",
        id: projectId,
        name,
        createdAt,
        updatedAt: now,
        targetYear: workspace.targetYear,
        document,
      };

      await this.repo.save(snapshot);

      // Avoid overwriting workspaceStore.projectName with stale name if user continued typing
      const latestName = customName
        ? name
        : useWorkspaceStore.getState().projectName;
      workspace.setProjectInfo(projectId, latestName);
      setActiveProjectId(projectId);
      return projectId;
    };

    const nextPromise = this.saveChain.catch(() => {}).then(run);
    this.saveChain = nextPromise;
    return nextPromise;
  }

  async loadProject(id: string): Promise<void> {
    this.cancelAutoSave();
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
    setActiveProjectId(project.id);
  }

  async hydrateActiveProject(): Promise<ProjectSnapshotV1> {
    if (this.inFlightHydration) {
      return this.inFlightHydration;
    }

    const run = async (): Promise<ProjectSnapshotV1> => {
      try {
        const activeId = getActiveProjectId();
        if (activeId) {
          try {
            const project = await this.repo.getById(activeId);
            if (project) {
              await this.loadProject(project.id);
              return project;
            }
          } catch (err) {
            console.warn("Failed to load active project from storage:", err);
          }
        }

        // If no active project ID exists or the project is missing in DB
        const projects = await this.repo.list();
        if (projects.length > 0) {
          const mostRecent = projects[0];
          const project = await this.repo.getById(mostRecent.id);
          if (project) {
            await this.loadProject(project.id);
            return project;
          }
        }

        // If no projects exist in DB, create/save an initial default project snapshot
        const initialId = await this.saveCurrentProject();
        const initialProject = await this.repo.getById(initialId);
        if (!initialProject) {
          throw new Error(`Failed to create initial project: ${initialId}`);
        }
        return initialProject;
      } finally {
        this.inFlightHydration = null;
      }
    };

    this.inFlightHydration = run();
    return this.inFlightHydration;
  }

  async listProjects() {
    return this.repo.list();
  }

  async deleteProject(id: string): Promise<void> {
    this.cancelAutoSave();
    const workspace = useWorkspaceStore.getState();
    const activeId = getActiveProjectId();

    const isCurrent = workspace.currentProjectId === id;
    const isActiveSession = activeId === id;

    await this.repo.delete(id);

    if (isCurrent || isActiveSession) {
      clearActiveProjectId();
      const remaining = await this.repo.list();
      if (remaining.length > 0) {
        await this.loadProject(remaining[0].id);
      } else {
        workspace.resetWorkspace();
        useDocumentStore
          .getState()
          .replaceDocument(createDefaultEditorDocument());
      }
    }
  }
}

export const projectOperations = new ProjectOperations();
