import type { PageBackground, PagePreviewConfig, Rect } from "./types";

// Explicit null clears a month even when a legacy shared background exists.
export function getPageBackground(config: PagePreviewConfig, month: string): PageBackground | null {
  if (config.backgrounds && Object.prototype.hasOwnProperty.call(config.backgrounds, month)) return config.backgrounds![month];
  return config.backgroundAssetId ? { assetId: config.backgroundAssetId } : null;
}

export function fitBackground(
  page: { width: number; height: number },
  image: { width: number; height: number },
  mode: "cover" | "contain" = "cover",
): Rect {
  const scale = Math[mode === "cover" ? "max" : "min"](page.width / image.width, page.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (page.width - width) / 2, y: (page.height - height) / 2, width, height };
}

export function resizeBackground(rect: Rect, dx: number, dy: number, corner: "nw" | "ne" | "sw" | "se"): Rect {
  const west = corner.includes("w");
  const north = corner.includes("n");
  const sx = west ? -1 : 1;
  const sy = north ? -1 : 1;
  const scale = Math.max(1 / Math.min(rect.width, rect.height),
    1 + (sx * dx * rect.width + sy * dy * rect.height) / (rect.width ** 2 + rect.height ** 2));
  const width = rect.width * scale;
  const height = rect.height * scale;
  return { x: west ? rect.x + rect.width - width : rect.x,
    y: north ? rect.y + rect.height - height : rect.y, width, height };
}
