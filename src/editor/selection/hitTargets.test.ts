import { describe, it, expect } from "vitest";
import { buildEditorHitTargets, getInteractiveHitBounds } from "./hitTargets";
import type { RenderScene, SceneTextNode, SceneImageNode, SceneDotNode } from "../../rendering/scene/types";

describe("hitTargets", () => {
  it("calculates accurate typographic bounds for text nodes", () => {
    const textNode: SceneTextNode = {
      kind: "text",
      semanticId: "main.date",
      instanceKey: "main.date:2027-05-01",
      text: "1",
      originX: 100,
      baselineY: 80,
      metrics: {
        width: 40,
        ascent: 16,
        descent: -4,
      },
      cell: { x: 50, y: 50, width: 100, height: 80 },
      position: { anchor: "top-left", offsetX: 10, offsetY: 8 },
      typography: {
        fontId: "main.date",
        fontSize: 18,
        fontWeight: 500,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#000",
        opacity: 1,
      },
      color: "#000",
      opacity: 1,
    };

    const scene: RenderScene = {
      width: 700,
      height: 500,
      nodes: [textNode],
    };

    const targets = buildEditorHitTargets(scene);
    expect(targets.length).toBe(1);
    expect(targets[0].semanticId).toBe("main.date");
    expect(targets[0].instanceKey).toBe("main.date:2027-05-01");
    expect(targets[0].bounds).toEqual({
      x: 100,
      y: 64,
      width: 40,
      height: 20,
    });
    expect(targets[0].cell).toEqual({ x: 50, y: 50, width: 100, height: 80 });
  });

  it("calculates bounds for image marker nodes", () => {
    const imageNode: SceneImageNode = {
      kind: "image",
      semanticId: "main.holiday.layer-1.holidayMarker",
      instanceKey: "main.holiday.layer-1.holidayMarker:2027-05-01",
      assetId: "img-1",
      x: 120,
      y: 60,
      width: 16,
      height: 16,
      opacity: 1,
      cell: { x: 50, y: 50, width: 100, height: 80 },
      position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
    };

    const scene: RenderScene = {
      width: 700,
      height: 500,
      nodes: [imageNode],
    };

    const targets = buildEditorHitTargets(scene);
    expect(targets.length).toBe(1);
    expect(targets[0].semanticId).toBe("main.holiday.layer-1.holidayMarker");
    expect(targets[0].bounds).toEqual({
      x: 120,
      y: 60,
      width: 16,
      height: 16,
    });
  });

  it("calculates bounds for dot marker nodes", () => {
    const dotNode: SceneDotNode = {
      kind: "dot",
      semanticId: "mini.holiday.layer-1.holidayMarker",
      instanceKey: "mini.holiday.layer-1.holidayMarker:2027-05-01",
      cx: 30,
      cy: 40,
      radius: 2,
      color: "#DC2626",
      opacity: 1,
      cell: { x: 0, y: 20, width: 40, height: 30 },
      position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
    };

    const scene: RenderScene = {
      width: 280,
      height: 210,
      nodes: [dotNode],
    };

    const targets = buildEditorHitTargets(scene);
    expect(targets.length).toBe(1);
    expect(targets[0].semanticId).toBe("mini.holiday.layer-1.holidayMarker");
    expect(targets[0].bounds).toEqual({
      x: 28,
      y: 38,
      width: 4,
      height: 4,
    });
  });

  it("expands small interaction bounds to at least 12x12 centered", () => {
    const smallBounds = { x: 28, y: 38, width: 4, height: 4 };
    const interactive = getInteractiveHitBounds(smallBounds);
    expect(interactive.width).toBe(12);
    expect(interactive.height).toBe(12);
    expect(interactive.x).toBe(24);
    expect(interactive.y).toBe(34);
  });
});
