import type { EditorDocument, WeekdayResizeSession } from "../model/types";

export function calculateResizedWeekdayHeight(
  currentHeight: number,
  deltaY: number,
  mainHeight: number,
): number {
  const raw = currentHeight + deltaY;
  const max = mainHeight - 1;
  return Math.max(0, Math.min(max, Math.round(raw)));
}

export function applyWeekdayResizeCommit(
  document: EditorDocument,
  resize: WeekdayResizeSession,
): EditorDocument {
  const currentHeight = document.mainTemplate.weekdayRow.height;
  const newHeight = calculateResizedWeekdayHeight(
    currentHeight,
    resize.deltaY,
    document.mainTemplate.height,
  );

  return {
    ...document,
    mainTemplate: {
      ...document.mainTemplate,
      weekdayRow: {
        ...document.mainTemplate.weekdayRow,
        height: newHeight,
      },
    },
  };
}
