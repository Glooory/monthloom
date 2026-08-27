import type { EditorDocument, DragSession } from "../model/types";
import { getElementPosition, setElementPosition } from "../model/templateBindings";

export function applyDragCommit(
  document: EditorDocument,
  drag: DragSession,
): EditorDocument {
  const currentPos = getElementPosition(document, drag.semanticId);
  const nextPos = {
    ...currentPos,
    offsetX: Math.round((currentPos.offsetX + drag.deltaX) * 100) / 100,
    offsetY: Math.round((currentPos.offsetY + drag.deltaY) * 100) / 100,
  };
  return setElementPosition(document, drag.semanticId, nextPos);
}
