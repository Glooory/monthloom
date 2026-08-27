import { describe, it, expect, beforeEach } from "vitest";
import { useDocumentStore, createDefaultEditorDocument } from "../state/documentStore";
import { useUiStore } from "../state/uiStore";
import { applyDragCommit } from "./drag";
import { createEffectiveDocument } from "../model/effectiveDocument";

describe("drag interaction", () => {
  beforeEach(() => {
    useDocumentStore.getState().replaceDocument(createDefaultEditorDocument());
    useUiStore.getState().setDrag(null);
  });

  it("updates transient state during pointermove and creates exactly one history entry on commit", () => {
    const initialDoc = useDocumentStore.getState().document;
    const initialOffsetX = initialDoc.mainTemplate.date.position.offsetX;

    // Simulate drag start
    useUiStore.getState().setDrag({
      semanticId: "main.date",
      instanceKey: "main.date:2027-05-01",
      deltaX: 0,
      deltaY: 0,
    });

    // Simulate 10 transient pointermove events
    for (let i = 1; i <= 10; i++) {
      useUiStore.getState().setDrag({
        semanticId: "main.date",
        instanceKey: "main.date:2027-05-01",
        deltaX: i * 2,
        deltaY: i * 1,
      });

      // Canonical document must remain unmodified
      expect(useDocumentStore.getState().document.mainTemplate.date.position.offsetX).toBe(initialOffsetX);

      // Effective document reflects live preview
      const effective = createEffectiveDocument({
        document: useDocumentStore.getState().document,
        drag: useUiStore.getState().drag,
        weekdayResize: null,
      });
      expect(effective.mainTemplate.date.position.offsetX).toBe(initialOffsetX + i * 2);
    }

    // Pointerup commits once
    const finalDrag = useUiStore.getState().drag!;
    const committedDoc = applyDragCommit(useDocumentStore.getState().document, finalDrag);
    useDocumentStore.getState().commitDocument(committedDoc);
    useUiStore.getState().setDrag(null);

    expect(useDocumentStore.getState().document.mainTemplate.date.position.offsetX).toBe(initialOffsetX + 20);

    // Exactly one undo restores the initial state
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().document.mainTemplate.date.position.offsetX).toBe(initialOffsetX);
  });
});
