import { create } from "zustand";
import type { HolidayDataset } from "../../domain/holiday/types";

export type WorkspaceState = {
  currentProjectId: string | null;
  projectName: string;
  targetYear: number;
  chinaHolidayDataset: HolidayDataset | null;
  japanHolidayDataset: HolidayDataset | null;

  setProjectInfo: (id: string | null, name: string) => void;
  setTargetYear: (year: number) => void;
  setChinaHolidayDataset: (dataset: HolidayDataset | null) => void;
  setJapanHolidayDataset: (dataset: HolidayDataset | null) => void;
  resetWorkspace: () => void;
  loadWorkspace: (data: {
    projectId: string;
    projectName: string;
    targetYear: number;
    chinaHolidayDataset: HolidayDataset | null;
    japanHolidayDataset: HolidayDataset | null;
  }) => void;
};

const DEFAULT_YEAR = 2027;
const DEFAULT_NAME = "Untitled Project";

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentProjectId: null,
  projectName: DEFAULT_NAME,
  targetYear: DEFAULT_YEAR,
  chinaHolidayDataset: null,
  japanHolidayDataset: null,

  setProjectInfo: (id, name) =>
    set({
      currentProjectId: id,
      projectName: name,
    }),

  setTargetYear: (year) =>
    set({
      targetYear: year,
    }),

  setChinaHolidayDataset: (dataset) =>
    set({
      chinaHolidayDataset: dataset,
    }),

  setJapanHolidayDataset: (dataset) =>
    set({
      japanHolidayDataset: dataset,
    }),

  resetWorkspace: () =>
    set({
      currentProjectId: null,
      projectName: DEFAULT_NAME,
      targetYear: DEFAULT_YEAR,
      chinaHolidayDataset: null,
      japanHolidayDataset: null,
    }),

  loadWorkspace: (data) =>
    set({
      currentProjectId: data.projectId,
      projectName: data.projectName,
      targetYear: data.targetYear,
      chinaHolidayDataset: data.chinaHolidayDataset,
      japanHolidayDataset: data.japanHolidayDataset,
    }),
}));
