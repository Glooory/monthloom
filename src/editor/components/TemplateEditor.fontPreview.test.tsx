import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SvgDocument } from "../../rendering/svg/document";
import type { RenderScene } from "../../rendering/scene/types";
import type { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import { selectElementFont, setElementPosition } from "../model/templateBindings";
import { createDefaultEditorDocument, useDocumentStore } from "../state/documentStore";
import { useEditorFontEngine } from "../fonts/useEditorFontEngine";
import { materializeSvg } from "../../rendering/svg/materialize";
import { TemplateEditor } from "./TemplateEditor";

vi.mock("../fonts/useEditorFontEngine", () => ({ useEditorFontEngine: vi.fn() }));
vi.mock("../../rendering/svg/materialize", () => ({ materializeSvg: vi.fn() }));
vi.mock("../../rendering/layout/mainLayout", () => ({ layoutMain: vi.fn(({ template }) => ({
  kind: template.date.typography.fontWeight === 900 ? "new"
    : template.date.position.offsetX === 123 ? "moved" : "old",
  width: 700, height: 500, nodes: [],
})) }));
vi.mock("../../rendering/layout/miniLayout", () => ({ layoutMini: vi.fn() }));
vi.mock("./EditorCanvas", () => ({
  EditorCanvas: ({ svgDocument, scene }: { svgDocument: SvgDocument | null; scene: RenderScene | null }) => (
    <div data-testid="editor-preview-state">
      {`${(scene as RenderScene & { kind?: string } | null)?.kind ?? "none"}:${(svgDocument as SvgDocument & { kind?: string } | null)?.kind ?? "none"}`}
    </div>
  ),
}));

describe("TemplateEditor font preview", () => {
  it("does not pair a new scene with the previous SVG while materialization is pending", async () => {
    useDocumentStore.getState().replaceDocument(createDefaultEditorDocument());
    const oldEngine = {} as ResolvedFontEngine;
    const newEngine = {} as ResolvedFontEngine;
    vi.mocked(useEditorFontEngine).mockImplementation(({ document }) => ({
      fontEngine: document.mainTemplate.date.typography.fontWeight === 900 ? newEngine : oldEngine,
      loading: false,
      error: null,
    }));
    vi.mocked(materializeSvg).mockImplementation(({ scene }) =>
      (scene as RenderScene & { kind?: string }).kind === "old"
        ? Promise.resolve({ kind: "old", width: 700, height: 500, nodes: [] } as unknown as SvgDocument)
        : new Promise(() => {}),
    );

    render(<TemplateEditor calendar={generateCalendarMonth(2027, 1)} />);
    await waitFor(() => expect(screen.getByTestId("editor-preview-state").textContent).toBe("old:old"));

    act(() => {
      const doc = useDocumentStore.getState().document;
      useDocumentStore.getState().commitDocument(setElementPosition(
        doc, "main.date", { ...doc.mainTemplate.date.position, offsetX: 123 },
      ));
    });
    expect(screen.getByTestId("editor-preview-state").textContent).toBe("old:old");

    act(() => {
      const doc = useDocumentStore.getState().document;
      useDocumentStore.getState().commitDocument(selectElementFont(
        doc,
        "main.date",
        { ...doc.fontCatalog["main.date"], weight: 900 },
        { ...doc.mainTemplate.date.typography, fontWeight: 900 },
      ));
    });

    expect(screen.getByTestId("editor-preview-state").textContent).toBe("new:none");
  });
});
