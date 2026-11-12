import { act, render, screen, waitFor } from "@testing-library/react";
import { useMemo } from "react";
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
      fontEngine: document.fontCatalog["main.holiday.builtin-cn-layer.name"].family === "Roboto Mono"
        ? null : document.mainTemplate.date.typography.fontWeight === 900 ? newEngine : oldEngine,
      issues: [],
      loading: false,
      error: document.fontCatalog["main.holiday.builtin-cn-layer.name"].family === "Roboto Mono"
        ? new Error("Failed to fetch") : null,
      retry: vi.fn(),
    }));
    vi.mocked(materializeSvg).mockImplementation(({ scene }) =>
      (scene as RenderScene & { kind?: string }).kind === "old"
        ? Promise.resolve({ kind: "old", width: 700, height: 500, nodes: [] } as unknown as SvgDocument)
        : new Promise(() => {}),
    );

    function EditorWithCalendar() {
      const layers = useDocumentStore((state) => state.document.holidayLayers);
      // App rebuilds the calendar when holiday layer typography changes.
      const calendar = useMemo(() => generateCalendarMonth(2027, 1), [layers]);
      return <TemplateEditor calendar={calendar} />;
    }
    render(<EditorWithCalendar />);
    await waitFor(() => expect(screen.getByTestId("editor-preview-state").textContent).toBe("old:old"));

    await act(async () => {
      const doc = useDocumentStore.getState().document;
      useDocumentStore.getState().commitDocument(setElementPosition(
        doc, "main.date", { ...doc.mainTemplate.date.position, offsetX: 123 },
      ));
    });
    expect(screen.getByTestId("editor-preview-state").textContent).toBe("old:old");

    await act(async () => {
      const doc = useDocumentStore.getState().document;
      useDocumentStore.getState().commitDocument(selectElementFont(
        doc,
        "main.date",
        { ...doc.fontCatalog["main.date"], weight: 900 },
        { ...doc.mainTemplate.date.typography, fontWeight: 900 },
      ));
    });

    expect(screen.getByTestId("editor-preview-state").textContent).toBe("old:old");

    await act(async () => {
      const doc = useDocumentStore.getState().document;
      const layer = doc.holidayLayers![0];
      useDocumentStore.getState().commitDocument(selectElementFont(
        doc,
        "main.holiday.builtin-cn-layer.name",
        { family: "Roboto Mono", weight: 400, style: "normal", source: { type: "google", family: "Roboto Mono" } },
        layer.main.name.typography,
      ));
    });
    expect(screen.getByRole("alert").textContent).toContain("Failed to fetch");
    expect(screen.getByTestId("editor-preview-state").textContent).toBe("old:old");
  });
});
