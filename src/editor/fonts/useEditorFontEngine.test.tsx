import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import { createDefaultEditorDocument } from "../state/documentStore";
import { selectElementFont } from "../model/templateBindings";
import { useEditorFontEngine } from "./useEditorFontEngine";
import { resolveFontEngine } from "../../resources/fonts/resolveFonts";
import type { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";

vi.mock("../../resources/fonts/resolveFonts", () => ({ resolveFontEngine: vi.fn() }));

describe("useEditorFontEngine", () => {
  it("does not expose the previous font engine while a changed face loads", async () => {
    const firstEngine = {} as ResolvedFontEngine;
    vi.mocked(resolveFontEngine)
      .mockResolvedValueOnce(firstEngine)
      .mockReturnValueOnce(new Promise(() => {}));
    const calendar = generateCalendarMonth(2027, 1);
    const firstDocument = createDefaultEditorDocument();
    const typography = firstDocument.mainTemplate.date.typography;
    const changedDocument = selectElementFont(
      firstDocument,
      "main.date",
      { ...firstDocument.fontCatalog["main.date"], weight: 900 },
      { ...typography, fontWeight: 900 },
    );
    const assetResolver = { resolve: vi.fn() };
    const { result, rerender } = renderHook(
      ({ document }) => useEditorFontEngine({ calendar, document, assetResolver }),
      { initialProps: { document: firstDocument } },
    );

    await waitFor(() => expect(result.current.fontEngine).toBe(firstEngine));
    rerender({ document: changedDocument });
    expect(result.current.fontEngine).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});
