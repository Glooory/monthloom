import { describe, it, expect } from "vitest";
import { calculateResizedWeekdayHeight, applyWeekdayResizeCommit } from "./weekdayResize";
import { createDefaultEditorDocument } from "../state/documentStore";

describe("weekdayResize", () => {
  it("calculates resized weekday height clamped between 0 and mainHeight - 1", () => {
    expect(calculateResizedWeekdayHeight(50, 20, 500)).toBe(70);
    expect(calculateResizedWeekdayHeight(50, -60, 500)).toBe(0);
    expect(calculateResizedWeekdayHeight(50, 600, 500)).toBe(499);
  });

  it("applies resize commit to main template height", () => {
    const doc = createDefaultEditorDocument();
    const updated = applyWeekdayResizeCommit(doc, {
      templateType: "main",
      deltaY: 15,
    });
    expect(updated.mainTemplate.weekdayRow.height).toBe(65);
  });
});
