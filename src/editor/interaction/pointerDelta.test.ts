import { describe, it, expect } from "vitest";
import { clientDeltaToSceneDelta } from "./pointerDelta";

describe("pointerDelta", () => {
  it("converts client pixel delta to scene-space delta based on scale", () => {
    const delta = clientDeltaToSceneDelta({
      clientDeltaX: 10,
      clientDeltaY: -5,
      renderedWidth: 350,
      renderedHeight: 250,
      sceneWidth: 700,
      sceneHeight: 500,
    });

    expect(delta.x).toBe(20);
    expect(delta.y).toBe(-10);
  });

  it("handles zero or negative rendered dimensions gracefully", () => {
    const delta = clientDeltaToSceneDelta({
      clientDeltaX: 10,
      clientDeltaY: -5,
      renderedWidth: 0,
      renderedHeight: 0,
      sceneWidth: 700,
      sceneHeight: 500,
    });

    expect(delta.x).toBe(0);
    expect(delta.y).toBe(0);
  });
});
