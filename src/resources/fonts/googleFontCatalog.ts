import catalog from "./googleFontCatalog.json";
import languageMetadata from "./googleFontLanguages.json";

// Google Fonts /metadata/fonts subset declarations, retrieved 2026-11-12.
// These are discovery hints, not guarantees of individual glyph coverage.
export type FontLanguageFilter = "all" | "zh" | "ja" | "zh-ja";
const languages: Readonly<Record<string, readonly string[]>> = languageMetadata;

export function matchesFontLanguage(subsets: readonly string[], filter: FontLanguageFilter): boolean {
  const chinese = subsets.some((subset) => subset.startsWith("chinese-"));
  const japanese = subsets.includes("japanese");
  return filter === "all" || (filter === "zh" ? chinese : filter === "ja" ? japanese : chinese && japanese);
}

export function supportsGoogleFontLanguage(family: string, filter: FontLanguageFilter): boolean {
  return matchesFontLanguage(languages[family] ?? [], filter);
}

// Snapshot of https://fonts.google.com/metadata/fonts, retrieved 2026-09-23.
// The catalog is bundled so font selection needs no API key or runtime metadata request.
const families = new Map(catalog.map((entry) => [entry.family, new Set(entry.variants)]));
const familyNames = catalog.map((entry) => entry.family);

export function listGoogleFontFamilies(language: FontLanguageFilter = "all"): readonly string[] {
  return language === "all" ? familyNames : familyNames.filter((family) => supportsGoogleFontLanguage(family, language));
}

export function searchGoogleFontFamilies(query: string, limit = 100, language: FontLanguageFilter = "all"): string[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [];
  return catalog
    .filter((entry) => entry.family.toLocaleLowerCase().includes(term) && supportsGoogleFontLanguage(entry.family, language))
    .slice(0, limit)
    .map((entry) => entry.family);
}

export function googleFontWeights(family: string, style: "normal" | "italic"): number[] {
  const variants = families.get(family);
  if (!variants) return [];
  return [...variants]
    .filter((variant) => style === "italic" ? variant.endsWith("i") : !variant.endsWith("i"))
    .map((variant) => Number.parseInt(variant, 10))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

export function supportsGoogleFontFace(
  family: string,
  weight: number,
  style: "normal" | "italic",
): boolean | null {
  const variants = families.get(family);
  if (!variants) return null;
  return variants.has(`${weight}${style === "italic" ? "i" : ""}`);
}

export function chooseGoogleFontFace(
  family: string,
  weight: number,
  style: "normal" | "italic",
): { weight: number; style: "normal" | "italic" } {
  const availableStyle = googleFontWeights(family, style).length > 0 ? style : "normal";
  const weights = googleFontWeights(family, availableStyle);
  if (weights.length === 0) return { weight, style };
  const closest = weights.reduce((best, candidate) =>
    Math.abs(candidate - weight) < Math.abs(best - weight) ? candidate : best,
  );
  return { weight: closest, style: availableStyle };
}
