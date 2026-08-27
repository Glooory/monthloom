import type { EditorDocument, DragSession, WeekdayResizeSession } from "./types";
import { getElementPosition, setElementPosition } from "./templateBindings";

export function createEffectiveDocument(args: {
  document: EditorDocument;
  drag: DragSession | null;
  weekdayResize: WeekdayResizeSession | null;
}): EditorDocument {
  const { document, drag, weekdayResize } = args;

  if (!drag && !weekdayResize) {
    return document;
  }

  let result = document;

  if (drag) {
    const currentPosition = getElementPosition(result, drag.semanticId);
    const effectivePosition = {
      ...currentPosition,
      offsetX: Math.round((currentPosition.offsetX + drag.deltaX) * 100) / 100,
      offsetY: Math.round((currentPosition.offsetY + drag.deltaY) * 100) / 100,
    };
    result = setElementPosition(result, drag.semanticId, effectivePosition);
  }

  if (weekdayResize) {
    const currentHeight = result.mainTemplate.weekdayRow.height;
    const rawHeight = currentHeight + weekdayResize.deltaY;
    const maxHeight = result.mainTemplate.height - 1;
    const clampedHeight = Math.max(0, Math.min(maxHeight, Math.round(rawHeight)));

    result = {
      ...result,
      mainTemplate: {
        ...result.mainTemplate,
        weekdayRow: {
          ...result.mainTemplate.weekdayRow,
          height: clampedHeight,
        },
      },
    };
  }

  return result;
}
