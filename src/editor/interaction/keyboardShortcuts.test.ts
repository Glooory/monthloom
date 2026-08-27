import { describe, it, expect } from "vitest";
import { matchUndoRedoShortcut, shouldIgnoreKeyboardShortcut } from "./keyboardShortcuts";

describe("keyboardShortcuts", () => {
  it("detects Cmd/Ctrl + Z as undo and Cmd/Ctrl + Shift + Z as redo", () => {
    const undoEvent = {
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      key: "z",
      target: document.createElement("div"),
    } as unknown as KeyboardEvent;

    expect(matchUndoRedoShortcut(undoEvent)).toBe("undo");

    const redoEvent = {
      metaKey: true,
      ctrlKey: false,
      shiftKey: true,
      key: "z",
      target: document.createElement("div"),
    } as unknown as KeyboardEvent;

    expect(matchUndoRedoShortcut(redoEvent)).toBe("redo");
  });

  it("ignores shortcut when typing inside input or textarea", () => {
    const input = document.createElement("input");
    const inputEvent = {
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      key: "z",
      target: input,
    } as unknown as KeyboardEvent;

    expect(shouldIgnoreKeyboardShortcut(input)).toBe(true);
    expect(matchUndoRedoShortcut(inputEvent)).toBeNull();
  });
});
