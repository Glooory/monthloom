import { buildGoogleFontsCssUrl } from "../../resources/fonts/googleFonts";
import { googleFontWeights } from "../../resources/fonts/googleFontCatalog";

const MAX_PREVIEWS = 96;
const previewLinks = new Map<string, HTMLLinkElement>();

export function getGoogleFontPreviewFace(family: string): {
  weight: number;
  style: "normal" | "italic";
} | null {
  const normalWeights = googleFontWeights(family, "normal");
  const style = normalWeights.length > 0 ? "normal" : "italic";
  const weights = style === "normal" ? normalWeights : googleFontWeights(family, "italic");
  if (weights.length === 0) return null;
  const weight = weights.reduce((closest, candidate) =>
    Math.abs(candidate - 400) < Math.abs(closest - 400) ? candidate : closest,
  );
  return { weight, style };
}

export function ensureGoogleFontPreview(family: string): void {
  if (previewLinks.has(family)) return;
  const face = getGoogleFontPreviewFace(family);
  if (!face) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = buildGoogleFontsCssUrl({ family, ...face, text: family });
  link.onerror = () => {
    if (previewLinks.get(family) === link) previewLinks.delete(family);
    link.remove();
  };
  document.head.appendChild(link);
  previewLinks.set(family, link);

  if (previewLinks.size > MAX_PREVIEWS) {
    const oldest = previewLinks.entries().next().value;
    if (oldest) {
      oldest[1].remove();
      previewLinks.delete(oldest[0]);
    }
  }
}
