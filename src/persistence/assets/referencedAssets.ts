import type { EditorDocument } from "../../editor/model/types";

export function collectReferencedAssetIds(
  document: EditorDocument,
): readonly string[] {
  const assetIds = new Set<string>();

  // 1. Holiday layers image markers (Main and Mini)
  if (document.holidayLayers) {
    for (const layer of document.holidayLayers) {
      if (
        layer.main.holidayMarker.marker.type === "image" &&
        layer.main.holidayMarker.marker.assetId
      ) {
        assetIds.add(layer.main.holidayMarker.marker.assetId);
      }
      if (
        layer.main.workdayMarker.marker.type === "image" &&
        layer.main.workdayMarker.marker.assetId
      ) {
        assetIds.add(layer.main.workdayMarker.marker.assetId);
      }
      if (
        layer.mini.holidayMarker.marker.type === "image" &&
        layer.mini.holidayMarker.marker.assetId
      ) {
        assetIds.add(layer.mini.holidayMarker.marker.assetId);
      }
      if (
        layer.mini.workdayMarker.marker.type === "image" &&
        layer.mini.workdayMarker.marker.assetId
      ) {
        assetIds.add(layer.mini.workdayMarker.marker.assetId);
      }
    }
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
