import { describe, it, expect, beforeEach } from "vitest";
import {
  useDocumentStore,
  createDefaultEditorDocument,
} from "./documentStore";

describe("documentStore", () => {
  beforeEach(() => {
    useDocumentStore.getState().replaceDocument(createDefaultEditorDocument());
  });

  it("initializes with default templates, font catalog, and page preview config", () => {
    const doc = useDocumentStore.getState().document;
    expect(doc.mainTemplate).toBeDefined();
    expect(doc.miniTemplate).toBeDefined();
    expect(doc.fontCatalog).toBeDefined();
    expect(doc.pagePreview).toBeDefined();
    expect(doc.mainTemplate.date.position.offsetX).toBe(10);
    expect(doc.pagePreview.layout.leftColumnRatio).toBe(0.3);
  });

  it("records history on commitDocument and supports undo and redo", () => {
    const initialDoc = useDocumentStore.getState().document;
    const initialX = initialDoc.mainTemplate.date.position.offsetX;

    const modifiedDoc = {
      ...initialDoc,
      mainTemplate: {
        ...initialDoc.mainTemplate,
        date: {
          ...initialDoc.mainTemplate.date,
          position: {
            ...initialDoc.mainTemplate.date.position,
            offsetX: 42,
          },
        },
      },
    };

    useDocumentStore.getState().commitDocument(modifiedDoc);
    expect(useDocumentStore.getState().document.mainTemplate.date.position.offsetX).toBe(42);

    // Undo
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().document.mainTemplate.date.position.offsetX).toBe(initialX);

    // Redo
    useDocumentStore.temporal.getState().redo();
    expect(useDocumentStore.getState().document.mainTemplate.date.position.offsetX).toBe(42);
  });

  it("supports undo and redo for Page Layout changes", () => {
    const initialDoc = useDocumentStore.getState().document;
    expect(initialDoc.pagePreview.layout.leftColumnRatio).toBe(0.3);

    const modifiedDoc = {
      ...initialDoc,
      pagePreview: {
        ...initialDoc.pagePreview,
        layout: {
          ...initialDoc.pagePreview.layout,
          leftColumnRatio: 0.34,
        },
      },
    };

    useDocumentStore.getState().commitDocument(modifiedDoc);
    expect(useDocumentStore.getState().document.pagePreview.layout.leftColumnRatio).toBe(0.34);

    // Undo
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().document.pagePreview.layout.leftColumnRatio).toBe(0.3);

    // Redo
    useDocumentStore.temporal.getState().redo();
    expect(useDocumentStore.getState().document.pagePreview.layout.leftColumnRatio).toBe(0.34);
  });

  it("replaceDocument replaces document and resets undo/redo history", () => {
    const initialDoc = useDocumentStore.getState().document;
    const modifiedDoc = {
      ...initialDoc,
      mainTemplate: {
        ...initialDoc.mainTemplate,
        date: {
          ...initialDoc.mainTemplate.date,
          position: {
            ...initialDoc.mainTemplate.date.position,
            offsetX: 99,
          },
        },
      },
    };

    useDocumentStore.getState().commitDocument(modifiedDoc);
    expect(useDocumentStore.temporal.getState().pastStates.length).toBeGreaterThan(0);

    const freshDoc = createDefaultEditorDocument();
    useDocumentStore.getState().replaceDocument(freshDoc);

    expect(useDocumentStore.getState().document.mainTemplate.date.position.offsetX).toBe(10);
    expect(useDocumentStore.temporal.getState().pastStates.length).toBe(0);
    expect(useDocumentStore.temporal.getState().futureStates.length).toBe(0);
  });
});
