import catalog from "./googleFontCatalog.json";

// Snapshot of https://fonts.google.com/metadata/fonts, retrieved 2026-09-23.
// The catalog is bundled so font selection needs no API key or runtime metadata request.
const families = new Map(catalog.map((entry) => [entry.family, new Set(entry.variants)]));
const familyNames = catalog.map((entry) => entry.family);

export function listGoogleFontFamilies(): readonly string[] {
  return familyNames;
}

export function searchGoogleFontFamilies(query: string, limit = 100): string[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [];
  return catalog
    .filter((entry) => entry.family.toLocaleLowerCase().includes(term))
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
