import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { FullYearPreview } from "./FullYearPreview";
import { useDocumentStore, createDefaultEditorDocument } from "../../editor/state/documentStore";
import { MemoryAssetStore } from "../../editor/assets/memoryAssetStore";
import { ResolvedFontEngine, type ResolvedFontFace } from "../../resources/fonts/fontkitEngine";
import * as resolveFontsModule from "../../resources/fonts/resolveFonts";
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
  faces.set("main.chinaHoliday", { ...face, fontId: "main.chinaHoliday" });
  faces.set("main.japanHoliday", { ...face, fontId: "main.japanHoliday" });
  faces.set("main.marker", { ...face, fontId: "main.marker", descriptor: { ...face.descriptor, weight: 500 } });
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
    vi.spyOn(resolveFontsModule, "resolveFontEngine").mockResolvedValue(mockEngine);
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
      mainTemplate: {
        ...doc.mainTemplate,
        height: 3000,
      },
    });

    render(
      <FullYearPreview
        targetYear={2027}
        coverageDiagnostics={diagnostics}
        assetResolver={assetStore}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/holiday-coverage-gap/).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/main-height-overflow/).length).toBeGreaterThan(0);
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
      expect(screen.getByRole("button", { name: /连续长卷/i }).className).toContain("active");
    });

    // Switch to grid mode
    fireEvent.click(screen.getByRole("button", { name: /13页平铺/i }));
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
      expect(screen.getByRole("button", { name: /13页平铺/i }).className).toContain("active");
    });
  });
});


