import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { FontCatalog } from "../../resources/fonts/types";

export type CalendarColors = MainTemplate["colors"];

export type EditableSemanticId =
  | "main.weekday"
  | "main.date"
  | "main.chinaHolidayName"
  | "main.japanHolidayName"
  | "main.chinaHolidayMarker"
  | "main.chinaWorkdayMarker"
  | "main.grid"
  | "mini.monthLabel"
  | "mini.weekday"
  | "mini.date"
  | "mini.holidayDot"
  | "mini.workdayDot";

export type PositionableSemanticId = Exclude<
  EditableSemanticId,
  "main.grid"
>;

export type EditorDocument = Readonly<{
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  fontCatalog: FontCatalog;
}>;

export type EditorSelection = Readonly<{
  semanticId: EditableSemanticId;
  instanceKey: string;
}>;

export type DragSession = Readonly<{
  semanticId: PositionableSemanticId;
  instanceKey: string;
  deltaX: number;
  deltaY: number;
}>;

export type WeekdayResizeSession = Readonly<{
  deltaY: number;
}>;

export type EditorUiState = {
  activeTemplate: "main" | "mini";
  selection: EditorSelection | null;
  hover: string | null;
  drag: DragSession | null;
  weekdayResize: WeekdayResizeSession | null;
  previewScale: number;
  setActiveTemplate: (template: "main" | "mini") => void;
  setSelection: (selection: EditorSelection | null) => void;
  setHover: (instanceKey: string | null) => void;
  setDrag: (drag: DragSession | null) => void;
  setWeekdayResize: (resize: WeekdayResizeSession | null) => void;
  setPreviewScale: (scale: number) => void;
  clearSelection: () => void;
};
