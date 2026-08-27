import { create } from "zustand";
import type { EditorUiState, EditorSelection, DragSession, WeekdayResizeSession } from "../model/types";

export const useUiStore = create<EditorUiState>((set) => ({
  activeTemplate: "main",
  selection: null,
  hover: null,
  drag: null,
  weekdayResize: null,
  previewScale: 1,

  setActiveTemplate: (activeTemplate: "main" | "mini") => {
    set({ activeTemplate, selection: null, hover: null, drag: null, weekdayResize: null });
  },

  setSelection: (selection: EditorSelection | null) => {
    set({ selection });
  },

  setHover: (hover: string | null) => {
    set({ hover });
  },

  setDrag: (drag: DragSession | null) => {
    set({ drag });
  },

  setWeekdayResize: (weekdayResize: WeekdayResizeSession | null) => {
    set({ weekdayResize });
  },

  setPreviewScale: (previewScale: number) => {
    set({ previewScale });
  },

  clearSelection: () => {
    set({ selection: null });
  },
}));
