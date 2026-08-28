import { create } from "zustand";

export type WorkspaceState = {
  currentProjectId: string | null;
  projectName: string;
  targetYear: number;

  setProjectInfo: (id: string | null, name: string) => void;
  setTargetYear: (year: number) => void;
  resetWorkspace: () => void;
  loadWorkspace: (data: {
    projectId: string;
    projectName: string;
    targetYear: number;
  }) => void;
};

const DEFAULT_YEAR = 2027;
const DEFAULT_NAME = "未命名项目";

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentProjectId: null,
  projectName: DEFAULT_NAME,
  targetYear: DEFAULT_YEAR,

  setProjectInfo: (id, name) =>
    set({
      currentProjectId: id,
      projectName: name,
    }),

  setTargetYear: (year) =>
    set({
      targetYear: year,
    }),

  resetWorkspace: () =>
    set({
      currentProjectId: null,
      projectName: DEFAULT_NAME,
      targetYear: DEFAULT_YEAR,
    }),

  loadWorkspace: (data) =>
    set({
      currentProjectId: data.projectId,
      projectName: data.projectName,
      targetYear: data.targetYear,
    }),
}));
