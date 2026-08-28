import { describe, it, expect } from "vitest";
import { createDefaultEditorDocument } from "../state/documentStore";
import { createEffectiveDocument } from "./effectiveDocument";

describe("effectiveDocument", () => {
  it("returns the exact document if there is no drag and no weekday resize", () => {
    const doc = createDefaultEditorDocument();
    const effective = createEffectiveDocument({
      document: doc,
      drag: null,
      weekdayResize: null,
    });
    expect(effective).toBe(doc);
  });

  it("derives effective document with drag delta applied to offset without mutating canonical document", () => {
    const doc = createDefaultEditorDocument();
    const initialOffsetX = doc.mainTemplate.date.position.offsetX;
    const initialOffsetY = doc.mainTemplate.date.position.offsetY;

    const effective = createEffectiveDocument({
      document: doc,
      drag: {
        semanticId: "main.date",
        instanceKey: "main.date:2027-05-01",
        deltaX: 5,
        deltaY: -3,
      },
      weekdayResize: null,
    });

    expect(effective.mainTemplate.date.position.offsetX).toBe(initialOffsetX + 5);
    expect(effective.mainTemplate.date.position.offsetY).toBe(initialOffsetY - 3);
    // Anchor remains unchanged
    expect(effective.mainTemplate.date.position.anchor).toBe(doc.mainTemplate.date.position.anchor);
    // Original canonical document unchanged
    expect(doc.mainTemplate.date.position.offsetX).toBe(initialOffsetX);
  });

  it("derives effective document with weekday row resize clamped appropriately", () => {
    const doc = createDefaultEditorDocument();
    const initialHeight = doc.mainTemplate.weekdayRow.height;

    const effective = createEffectiveDocument({
      document: doc,
      drag: null,
      weekdayResize: { templateType: "main", deltaY: 12 },
    });

    expect(effective.mainTemplate.weekdayRow.height).toBe(initialHeight + 12);
    expect(doc.mainTemplate.weekdayRow.height).toBe(initialHeight);

    // Clamping to [0, maxHeight - 1]
    const clampedUnder = createEffectiveDocument({
      document: doc,
      drag: null,
      weekdayResize: { templateType: "main", deltaY: -100 },
    });
    expect(clampedUnder.mainTemplate.weekdayRow.height).toBe(0);

    const clampedOver = createEffectiveDocument({
      document: doc,
      drag: null,
      weekdayResize: { templateType: "main", deltaY: 1000 },
    });
    expect(clampedOver.mainTemplate.weekdayRow.height).toBe(doc.mainTemplate.height - 1);
  });
});
