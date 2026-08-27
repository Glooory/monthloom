export type UndoRedoAction = "undo" | "redo" | null;

export function shouldIgnoreKeyboardShortcut(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  return false;
}

export function matchUndoRedoShortcut(event: KeyboardEvent): UndoRedoAction {
  if (shouldIgnoreKeyboardShortcut(event.target)) {
    return null;
  }

  const isMod = event.metaKey || event.ctrlKey;
  if (!isMod) return null;

  if (event.key.toLowerCase() === "z") {
    if (event.shiftKey) {
      return "redo";
    }
    return "undo";
  }

  if (event.key.toLowerCase() === "y" && !event.shiftKey) {
    return "redo";
  }

  return null;
}
