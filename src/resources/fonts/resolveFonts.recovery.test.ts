import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FontDescriptor } from "../../domain/template/font";
import { fetchGoogleFontBinary } from "./googleFonts";
import { PersistentFontCache } from "./fontCache";
import { ResolvedFontEngine, parseFontkitFace } from "./fontkitEngine";
import {
  assertFontCharacters,
  resolveFontEngine,
  resolveFontFace,
} from "./resolveFonts";
import { resolvePreviewFontEngine } from "./previewFonts";
import { FontCoverageError } from "./fontErrors";
import { createDefaultEditorDocument } from "../../editor/state/documentStore";
import { editorDocumentSchema } from "../../persistence/schema/projectSnapshot";

vi.mock("./googleFonts", () => ({ fetchGoogleFontBinary: vi.fn() }));
const bytes = Uint8Array.from(
  readFileSync("src/resources/fonts/bundled/NotoSansSC-Regular.otf"),
).buffer;
const fallbackDescriptor: FontDescriptor = {
  family: "Bundled",
  weight: 400,
  style: "normal",
  source: { type: "local", assetId: "bundled" },
};
const fallback = parseFontkitFace({
  fontId: "fallback",
  descriptor: fallbackDescriptor,
  bytes,
});
let cache: PersistentFontCache;
const requested: FontDescriptor = {
  family: "Requested",
  weight: 600,
  style: "normal",
  source: { type: "google", family: "Requested" },
};

beforeEach(() => {
  vi.mocked(fetchGoogleFontBinary).mockReset().mockResolvedValue(bytes);
  cache = new PersistentFontCache();
  vi.spyOn(cache, "get").mockResolvedValue(null);
  vi.spyOn(cache, "set").mockResolvedValue();
  vi.spyOn(cache, "delete").mockResolvedValue();
});

describe("shared font recovery", () => {
  it.each([
    ["main", "holidayMarker"],
    ["main", "workdayMarker"],
    ["mini", "holidayMarker"],
    ["mini", "workdayMarker"],
  ] as const)("renders a saved %s %s with the legacy font reference", async (target, element) => {
    const document = createDefaultEditorDocument();
    const layer = document.holidayLayers[0];
    const marker = layer[target][element].marker;
    if (marker.type !== "text") throw new Error("Expected text marker");
    const saved = {
      ...document,
      holidayLayers: [{
        ...layer,
        [target]: {
          ...layer[target],
          [element]: {
            ...layer[target][element],
            marker: { ...marker, typography: { ...marker.typography, fontId: "main.marker" } },
          },
        },
      }],
    };
    const loaded = editorDocumentSchema.parse(saved);
    const result = await resolvePreviewFontEngine({
      catalog: loaded.fontCatalog,
      requirements: new Map([["main.marker", "休"]]),
      fontCache: cache,
    });
    expect(result.fontEngine.getResolvedFace("main.marker")).toBeDefined();
    expect(result.issues).toEqual([]);
    expect(saved.fontCatalog["main.marker"]).toBeUndefined();
  });

  it("shares in-flight requests and reuses a prepared character superset", async () => {
    const options = { fontCache: cache };
    const [a, b] = await Promise.all([
      resolveFontFace(requested, "012春节元日", options),
      resolveFontFace(requested, "日元节春210", options),
    ]);
    expect(a).toBe(b);
    await resolveFontFace(requested, "12元日", options);
    expect(fetchGoogleFontBinary).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchGoogleFontBinary).mock.calls[0][0].text.length).toBe(
      7,
    );
  });

  it("evicts failed requests so retry performs a real new download", async () => {
    vi.mocked(fetchGoogleFontBinary).mockRejectedValueOnce(
      new Error("offline"),
    );
    await expect(
      resolveFontFace(requested, "12", { fontCache: cache }),
    ).rejects.toThrow("offline");
    await resolveFontFace(requested, "12", { fontCache: cache });
    expect(fetchGoogleFontBinary).toHaveBeenCalledTimes(2);
  });

  it("deletes corrupt persistent data and downloads a validated replacement", async () => {
    vi.mocked(cache.get).mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    await resolveFontFace(requested, "春节", { fontCache: cache });
    expect(cache.delete).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledTimes(1);
  });

  it("combines text used by different elements with the same face", async () => {
    await resolveFontEngine({
      catalog: { date: requested, weekday: requested },
      requirements: new Map([
        ["date", "012"],
        ["weekday", "月火"],
      ]),
      fontCache: cache,
    });
    expect(fetchGoogleFontBinary).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchGoogleFontBinary).mock.calls[0][0].text).toContain(
      "火",
    );
  });

  it("uses a real bundled face for first-load preview failure without mutating the catalog", async () => {
    vi.mocked(fetchGoogleFontBinary).mockRejectedValue(new Error("offline"));
    const catalog = { date: requested };
    const options = {
      catalog,
      requirements: new Map([["date", "春节元日012"]]),
      fontCache: cache,
    };
    const { fontEngine, issues } = await resolvePreviewFontEngine({
      ...options,
      loadFallback: async () => fallback,
    });
    expect(issues).toHaveLength(1);
    expect(fontEngine.getDescriptor("date").family).toBe("Bundled");
    const typography = {
      fontId: "date",
      fontWeight: 600,
      fontStyle: "normal" as const,
      fontSize: 12,
      letterSpacing: 0,
      color: "#000",
      opacity: 1,
    };
    expect(fontEngine.measure("春节", typography).width).toBeGreaterThan(0);
    expect(
      fontEngine.outline({
        text: "元日",
        typography,
        originX: 0,
        baselineY: 12,
      }).length,
    ).toBeGreaterThan(0);
    expect(catalog.date).toBe(requested);
    await expect(resolveFontEngine(options)).rejects.toThrow("offline");
  });

  it("prefers the previous valid face but replaces it if new text needs missing characters", async () => {
    vi.mocked(fetchGoogleFontBinary).mockRejectedValue(new Error("offline"));
    const previousFace = { ...fallback, fontId: "date" };
    const previous = new ResolvedFontEngine(new Map([["date", previousFace]]));
    const loadFallback = vi.fn(async () => fallback);
    const args = {
      catalog: { date: requested },
      requirements: new Map([["date", "元日"]]),
      fontCache: cache,
      previous,
      loadFallback,
    };
    const result = await resolvePreviewFontEngine(args);
    expect(result.fontEngine.getResolvedFace("date")?.internalFont).toBe(
      previousFace.internalFont,
    );
    expect(loadFallback).not.toHaveBeenCalled();
    const asciiOnly = {
      ...previousFace,
      internalFont: { hasGlyphForCodePoint: (code: number) => code < 128 },
    };
    await resolvePreviewFontEngine({
      ...args,
      previous: new ResolvedFontEngine(new Map([["date", asciiOnly]])),
    });
    expect(loadFallback).toHaveBeenCalledTimes(1);
  });

  it("validates Chinese, Japanese, kana and ASCII coverage and rejects missing glyphs", () => {
    expect(() =>
      assertFontCharacters(
        fallback,
        "春节清明劳动节憲法記念日こどもの日カレンダー0123456789Sun-",
      ),
    ).not.toThrow();
    expect(() => assertFontCharacters(fallback, "\u{1FAE8}")).toThrow(FontCoverageError);
  });
});
