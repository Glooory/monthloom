import type { EditorDocument } from "../../editor/model/types";

export function collectReferencedAssetIds(document: EditorDocument): readonly string[] {
  const assetIds = new Set<string>();

  // 1. Main template image markers
  if (
    document.mainTemplate.chinaMarkers.holiday.type === "image" &&
    document.mainTemplate.chinaMarkers.holiday.assetId
  ) {
    assetIds.add(document.mainTemplate.chinaMarkers.holiday.assetId);
  }
  if (
    document.mainTemplate.chinaMarkers.workday.type === "image" &&
    document.mainTemplate.chinaMarkers.workday.assetId
  ) {
    assetIds.add(document.mainTemplate.chinaMarkers.workday.assetId);
  }

  // 2. Font catalog local fonts
  for (const descriptor of Object.values(document.fontCatalog)) {
    if (descriptor.source.type === "local" && descriptor.source.assetId) {
      assetIds.add(descriptor.source.assetId);
    }
  }

  // 3. Page preview background
  if (document.pagePreview.backgroundAssetId) {
    assetIds.add(document.pagePreview.backgroundAssetId);
  }

  return Array.from(assetIds);
}
