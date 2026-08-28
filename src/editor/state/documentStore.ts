import { create } from "zustand";
import { temporal } from "zundo";
import { DEFAULT_PAGE_PREVIEW_CONFIG } from "../../domain/pagePreview/defaults";
import { DEFAULT_MAIN_TEMPLATE, DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import { createDefaultHolidayLayers } from "../../domain/template/holidayLayer";
import type { EditorDocument } from "../model/types";
import type { FontCatalog } from "../../resources/fonts/types";

export const DEFAULT_FONT_CATALOG: FontCatalog = {
  "default-sans": {
    family: "Noto Sans",
    weight: 400,
    style: "normal",
    source: { type: "google", family: "Noto Sans" },
  },
  "main.weekday": {
    family: "Noto Sans",
    weight: 600,
    style: "normal",
    source: { type: "google", family: "Noto Sans" },
  },
  "main.date": {
    family: "Noto Sans",
    weight: 500,
    style: "normal",
    source: { type: "google", family: "Noto Sans" },
  },
  "main.holiday.builtin-cn-layer.name": {
    family: "Noto Sans SC",
    weight: 400,
    style: "normal",
    source: { type: "google", family: "Noto Sans SC" },
  },
  "main.holiday.builtin-cn-layer.marker": {
    family: "Noto Sans SC",
    weight: 500,
    style: "normal",
    source: { type: "google", family: "Noto Sans SC" },
  },
  "main.holiday.builtin-jp-layer.name": {
    family: "Noto Sans JP",
    weight: 400,
    style: "normal",
    source: { type: "google", family: "Noto Sans JP" },
  },
  "main.holiday.builtin-jp-layer.marker": {
    family: "Noto Sans JP",
    weight: 500,
    style: "normal",
    source: { type: "google", family: "Noto Sans JP" },
  },
  "mini.monthLabel": {
    family: "Noto Sans",
    weight: 600,
    style: "normal",
    source: { type: "google", family: "Noto Sans" },
  },
  "mini.weekday": {
    family: "Noto Sans",
    weight: 500,
    style: "normal",
    source: { type: "google", family: "Noto Sans" },
  },
  "mini.date": {
    family: "Noto Sans",
    weight: 400,
    style: "normal",
    source: { type: "google", family: "Noto Sans" },
  },
};

export function createDefaultEditorDocument(): EditorDocument {
  const mainTemplate = {
    ...DEFAULT_MAIN_TEMPLATE,
    weekdayRow: {
      ...DEFAULT_MAIN_TEMPLATE.weekdayRow,
      weekday: {
        ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday,
        typography: {
          ...DEFAULT_MAIN_TEMPLATE.weekdayRow.weekday.typography,
          fontId: "main.weekday",
        },
      },
    },
    date: {
      ...DEFAULT_MAIN_TEMPLATE.date,
      typography: {
        ...DEFAULT_MAIN_TEMPLATE.date.typography,
        fontId: "main.date",
      },
    },
  };

  const miniTemplate = {
    ...DEFAULT_MINI_TEMPLATE,
    monthRow: {
      ...DEFAULT_MINI_TEMPLATE.monthRow,
      label: {
        ...DEFAULT_MINI_TEMPLATE.monthRow.label,
        typography: {
          ...DEFAULT_MINI_TEMPLATE.monthRow.label.typography,
          fontId: "mini.monthLabel",
        },
      },
    },
    weekdayRow: {
      ...DEFAULT_MINI_TEMPLATE.weekdayRow,
      weekday: {
        ...DEFAULT_MINI_TEMPLATE.weekdayRow.weekday,
        typography: {
          ...DEFAULT_MINI_TEMPLATE.weekdayRow.weekday.typography,
          fontId: "mini.weekday",
        },
      },
    },
    date: {
      ...DEFAULT_MINI_TEMPLATE.date,
      typography: {
        ...DEFAULT_MINI_TEMPLATE.date.typography,
        fontId: "mini.date",
      },
    },
  };

  return {
    mainTemplate,
    miniTemplate,
    holidayLayers: createDefaultHolidayLayers(),
    fontCatalog: DEFAULT_FONT_CATALOG,
    pagePreview: DEFAULT_PAGE_PREVIEW_CONFIG,
  };
}

export type DocumentStore = {
  document: EditorDocument;
  commitDocument: (next: EditorDocument) => void;
  replaceDocument: (next: EditorDocument) => void;
};

export const useDocumentStore = create<DocumentStore>()(
  temporal(
    (set) => ({
      document: createDefaultEditorDocument(),
      commitDocument: (next: EditorDocument) => {
        set({ document: next });
      },
      replaceDocument: (next: EditorDocument) => {
        set({ document: next });
        useDocumentStore.temporal.getState().clear();
      },
    }),
    {
      limit: 100,
      partialize: (state) => ({ document: state.document }),
      equality: (past, current) => past.document === current.document,
    },
  ),
);
