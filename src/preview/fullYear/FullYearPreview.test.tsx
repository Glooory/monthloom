import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { FullYearPreview } from "./FullYearPreview";
import { useDocumentStore, createDefaultEditorDocument } from "../../editor/state/documentStore";
import { MemoryAssetStore } from "../../editor/assets/memoryAssetStore";
import { ResolvedFontEngine, type ResolvedFontFace } from "../../resources/fonts/fontkitEngine";
import * as resolveFontsModule from "../../resources/fonts/previewFonts";
import * as renderDocumentsModule from "./renderDocuments";
import * as pagePreviewModule from "./PagePreview";
import { selectElementFont } from "../../editor/model/templateBindings";
import type { HolidayDiagnostic } from "../../domain/holiday/types";

function createMockFontEngine(): ResolvedFontEngine {
  const face: ResolvedFontFace = {
    fontId: "default-sans",
    descriptor: {
      family: "Noto Sans",
      weight: 400,
      style: "normal",
      source: { type: "google", family: "Noto Sans" },
    },
    unitsPerEm: 1000,
    ascent: 800,
    descent: -200,
    internalFont: {
      unitsPerEm: 1000,
      ascent: 800,
      descent: -200,
      layout(text: string) {
        return {
          advanceWidth: text.length * 500,
          glyphs: Array.from(text).map((_, i) => ({
            id: i + 1,
            advanceWidth: 500,
            path: { toSVG: () => `M0 0 L500 0` },
          })),
          positions: Array.from(text).map(() => ({
            xAdvance: 500,
            yAdvance: 0,
            xOffset: 0,
            yOffset: 0,
          })),
        };
      },
    },
  };

  const faces = new Map<string, ResolvedFontFace>();
  faces.set("default-sans", face);
  faces.set("main.weekday", { ...face, fontId: "main.weekday", descriptor: { ...face.descriptor, weight: 600 } });
  faces.set("main.date", { ...face, fontId: "main.date", descriptor: { ...face.descriptor, weight: 500 } });
  faces.set("main.holiday.builtin-cn-layer.name", { ...face, fontId: "main.holiday.builtin-cn-layer.name" });
  faces.set("main.holiday.builtin-cn-layer.marker", { ...face, fontId: "main.holiday.builtin-cn-layer.marker", descriptor: { ...face.descriptor, weight: 500 } });
  faces.set("main.holiday.builtin-jp-layer.name", { ...face, fontId: "main.holiday.builtin-jp-layer.name" });
  faces.set("main.holiday.builtin-jp-layer.marker", { ...face, fontId: "main.holiday.builtin-jp-layer.marker", descriptor: { ...face.descriptor, weight: 500 } });
  faces.set("mini.monthLabel", { ...face, fontId: "mini.monthLabel", descriptor: { ...face.descriptor, weight: 600 } });
  faces.set("mini.weekday", { ...face, fontId: "mini.weekday", descriptor: { ...face.descriptor, weight: 500 } });
  faces.set("mini.date", { ...face, fontId: "mini.date" });

  return new ResolvedFontEngine(faces);
}

describe("FullYearPreview", () => {
  const assetStore = new MemoryAssetStore();

  beforeEach(() => {
    useDocumentStore.getState().replaceDocument(createDefaultEditorDocument());
    const mockEngine = createMockFontEngine();
    vi.spyOn(resolveFontsModule, "resolvePreviewFontEngine").mockResolvedValue({ fontEngine: mockEngine, issues: [] });
  });

  it("renders 13 pages in vertical flow for target year 2027", async () => {
    render(
      <FullYearPreview
        targetYear={2027}
        assetResolver={assetStore}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("2027-1")).toBeDefined();
    });

    expect(screen.getByText("2027-1")).toBeDefined();
    expect(screen.getByText("2027-12")).toBeDefined();
    expect(screen.getByText("2028-1")).toBeDefined();
  });

  it("surfaces holiday coverage diagnostics and layout warnings", async () => {
    const diagnostics: HolidayDiagnostic[] = [
      {
        code: "holiday-coverage-gap",
        level: "warning",
        message: "Missing holiday coverage for 2028",
      },
    ];

    // Trigger a layout warning with large height
    const doc = useDocumentStore.getState().document;
    useDocumentStore.getState().commitDocument({
      ...doc,
      pagePreview: { ...doc.pagePreview, layout: { ...doc.pagePreview.layout,
        main: { ...doc.pagePreview.layout.main, height: 3000 },
      } },
    });

    render(
      <FullYearPreview
        targetYear={2027}
        coverageDiagnostics={diagnostics}
        assetResolver={assetStore}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Missing holiday coverage for 2028/).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/calendar-overflow/).length).toBeGreaterThan(0);
  });

  it("defaults to flow mode and persists mode changes in localStorage", async () => {
    localStorage.clear();

    const { unmount } = render(
      <FullYearPreview
        targetYear={2027}
        assetResolver={assetStore}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /连续滚动/i }).className).toContain("active");
    });

    // Switch to grid mode
    fireEvent.click(screen.getByRole("button", { name: /分页网格/i }));
    expect(localStorage.getItem("monthloom_preview_mode")).toBe("grid");

    unmount();

    // Re-mount and verify it reads grid mode
    render(
      <FullYearPreview
        targetYear={2027}
        assetResolver={assetStore}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /分页网格/i }).className).toContain("active");
    });
  });

  it("does not render changed typography with the previous font engine", async () => {
    const firstEngine = createMockFontEngine();
    vi.mocked(resolveFontsModule.resolvePreviewFontEngine)
      .mockReset()
      .mockResolvedValueOnce({ fontEngine: firstEngine, issues: [] })
      .mockReturnValueOnce(new Promise(() => {}));
    const renderSpy = vi.spyOn(renderDocumentsModule, "renderFullYearPreviewDocuments");
    render(<FullYearPreview targetYear={2027} assetResolver={assetStore} />);
    await waitFor(() => expect(screen.getByText("2027-1")).toBeDefined());
    const renderedBeforeChange = renderSpy.mock.calls.length;

    await act(async () => {
      const doc = useDocumentStore.getState().document;
      useDocumentStore.getState().commitDocument(selectElementFont(
        doc,
        "main.date",
        { ...doc.fontCatalog["main.date"], weight: 900 },
        { ...doc.mainTemplate.date.typography, fontWeight: 900 },
      ));
    });

    expect(renderSpy.mock.calls.length).toBe(renderedBeforeChange);
  });

  it("retains the last complete pages while a replacement font loads", async () => {
    const firstEngine = createMockFontEngine();
    vi.mocked(resolveFontsModule.resolvePreviewFontEngine)
      .mockReset()
      .mockResolvedValueOnce({ fontEngine: firstEngine, issues: [] })
      .mockReturnValueOnce(new Promise(() => {}));
    const pageSpy = vi.spyOn(pagePreviewModule, "PagePreview");
    render(<FullYearPreview targetYear={2027} assetResolver={assetStore} />);
    await waitFor(() => expect(screen.getByText("2027-1")).toBeDefined());
    const pageRendersBeforeChange = pageSpy.mock.calls.length;

    await act(async () => {
      const doc = useDocumentStore.getState().document;
      useDocumentStore.getState().commitDocument(selectElementFont(
        doc,
        "main.date",
        { ...doc.fontCatalog["main.date"], weight: 900 },
        { ...doc.mainTemplate.date.typography, fontWeight: 900 },
      ));
    });

    expect(pageSpy.mock.calls.length).toBeGreaterThan(pageRendersBeforeChange);
    expect(screen.getByText("2027-1")).toBeDefined();
  });
});
