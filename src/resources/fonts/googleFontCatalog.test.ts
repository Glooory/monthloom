import { describe, expect, it } from "vitest";
import {
  chooseGoogleFontFace,
  googleFontWeights,
  listGoogleFontFamilies,
  searchGoogleFontFamilies,
  supportsGoogleFontFace,
  supportsGoogleFontLanguage,
  matchesFontLanguage,
} from "./googleFontCatalog";

describe("Google Fonts catalog", () => {
  it("filters using declared language metadata rather than family name guesses", () => {
    expect(listGoogleFontFamilies("zh")).toContain("Noto Sans SC");
    expect(listGoogleFontFamilies("ja")).toContain("Noto Sans JP");
    expect(listGoogleFontFamilies("zh")).not.toContain("Roboto Mono");
    expect(supportsGoogleFontLanguage("Unclassified Chinese Font", "zh")).toBe(false);
    expect(supportsGoogleFontLanguage("Noto Sans SC", "zh-ja")).toBe(false);
    expect(matchesFontLanguage(["chinese-simplified", "japanese"], "zh-ja")).toBe(true);
    expect(searchGoogleFontFamilies("Noto", 100, "ja")).toContain("Noto Sans JP");
    expect(searchGoogleFontFamilies("Roboto", 100, "zh")).toEqual([]);
  });
  it("offers the full catalog without a search query", () => {
    expect(listGoogleFontFamilies().length).toBeGreaterThan(1000);
    expect(listGoogleFontFamilies()).toContain("Merriweather");
  });

  it("searches beyond the former short picker list", () => {
    expect(searchGoogleFontFamilies("Merriweather")).toContain("Merriweather");
  });

  it("chooses a served face when the requested weight is unavailable", () => {
    expect(supportsGoogleFontFace("Lato", 500, "normal")).toBe(false);
    expect(chooseGoogleFontFace("Lato", 500, "normal"))
      .toEqual({ weight: 400, style: "normal" });
    expect(googleFontWeights("Noto Sans SC", "italic")).toEqual([]);
    expect(chooseGoogleFontFace("Noto Sans SC", 700, "italic"))
      .toEqual({ weight: 700, style: "normal" });
  });
});
