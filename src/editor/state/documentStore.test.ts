import { describe, it, expect, beforeEach } from "vitest";
import {
  useDocumentStore,
  createDefaultEditorDocument,
} from "./documentStore";

describe("documentStore", () => {
  beforeEach(() => {
    useDocumentStore.getState().replaceDocument(createDefaultEditorDocument());
  });

  it("repairs legacy Mini dots on restore without changing customized markers or the input", () => {
    const document = createDefaultEditorDocument();
    const legacy = {
      ...document,
      holidayLayers: document.holidayLayers!.map((layer) => ({
        ...layer,
        mini: {
          ...layer.mini,
          holidayMarker: layer.mini.holidayMarker.marker.type === "text" ? {
            ...layer.mini.holidayMarker,
            marker: {
              ...layer.mini.holidayMarker.marker,
              typography: { ...layer.mini.holidayMarker.marker.typography, fontWeight: 700 },
            },
          } : layer.mini.holidayMarker,
          workdayMarker: layer.mini.workdayMarker.marker.type === "text" ? {
            ...layer.mini.workdayMarker,
            marker: { ...layer.mini.workdayMarker.marker, value: "custom" },
          } : layer.mini.workdayMarker,
        },
      })),
    };
    useDocumentStore.getState().replaceDocument(legacy);
    const restored = useDocumentStore.getState().document;
    for (const [index, layer] of restored.holidayLayers!.entries()) {
      const marker = layer.mini.holidayMarker.marker;
      expect(marker.type === "text" && marker.typography.fontWeight).toBe(400);
      expect(layer.mini.workdayMarker).toBe(legacy.holidayLayers[index].mini.workdayMarker);
      const original = legacy.holidayLayers[index].mini.holidayMarker.marker;
      expect(original.type === "text" && original.typography.fontWeight).toBe(700);
    }
    expect(useDocumentStore.temporal.getState().pastStates).toHaveLength(0);
  });

  it("initializes with default templates, font catalog, and page preview config", () => {
    const doc = useDocumentStore.getState().document;
    expect(doc.mainTemplate).toBeDefined();
    expect(doc.miniTemplate).toBeDefined();
    expect(doc.fontCatalog).toBeDefined();
    expect(doc.pagePreview).toBeDefined();
    expect(doc.mainTemplate.date.position.offsetX).toBe(10);
    expect(doc.pagePreview.layout.width).toBe(1400);
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
    expect(initialDoc.pagePreview.layout.width).toBe(1400);

    const modifiedDoc = {
      ...initialDoc,
      pagePreview: {
        ...initialDoc.pagePreview,
        layout: {
          ...initialDoc.pagePreview.layout,
          width: 1500,
        },
      },
    };

    useDocumentStore.getState().commitDocument(modifiedDoc);
    expect(useDocumentStore.getState().document.pagePreview.layout.width).toBe(1500);

    // Undo
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().document.pagePreview.layout.width).toBe(1400);

    // Redo
    useDocumentStore.temporal.getState().redo();
    expect(useDocumentStore.getState().document.pagePreview.layout.width).toBe(1500);
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
