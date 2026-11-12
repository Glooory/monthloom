import { describe, expect, it, vi } from "vitest";
import { getCachedInstalledFonts, getStoredInstalledFonts, localFontWeight, queryInstalledFonts, queryLocalFontFace } from "./localFonts";

describe("localFontWeight", () => {
  it("maps common installed face styles to SVG weights", () => {
    expect(localFontWeight("Regular")).toBe(400);
    expect(localFontWeight("SemiBold Italic")).toBe(600);
    expect(localFontWeight("ExtraBold")).toBe(800);
    expect(localFontWeight("Black")).toBe(900);
  });

  it("keeps queried faces for later inspector instances", async () => {
    localStorage.clear();
    const faces = [{ family: "Test Sans", fullName: "Test Sans Regular", postscriptName: "TestSans-Regular", style: "Regular", blob: vi.fn() }];
    const query = vi.fn(async () => faces);
    const original = (window as Window & { queryLocalFonts?: typeof query }).queryLocalFonts;
    Object.defineProperty(window, "queryLocalFonts", { configurable: true, value: query });
    try {
      expect(await queryInstalledFonts()).toEqual(faces);
      expect(getCachedInstalledFonts()).toEqual(faces);
      expect(getStoredInstalledFonts()).toEqual([{
        family: "Test Sans", fullName: "Test Sans Regular",
        postscriptName: "TestSans-Regular", style: "Regular",
      }]);
    } finally {
      Object.defineProperty(window, "queryLocalFonts", { configurable: true, value: original });
    }
  });

  it("requests a stored face by PostScript name when the user selects it", async () => {
    const face = { family: "Test Sans", fullName: "Test Sans Bold", postscriptName: "TestSans-Bold", style: "Bold", blob: vi.fn() };
    const query = vi.fn(async () => [face]);
    const original = (window as Window & { queryLocalFonts?: typeof query }).queryLocalFonts;
    Object.defineProperty(window, "queryLocalFonts", { configurable: true, value: query });
    try {
      expect(await queryLocalFontFace("TestSans-Bold")).toBe(face);
      expect(query).toHaveBeenCalledWith({ postscriptNames: ["TestSans-Bold"] });
    } finally {
      Object.defineProperty(window, "queryLocalFonts", { configurable: true, value: original });
    }
  });
});
