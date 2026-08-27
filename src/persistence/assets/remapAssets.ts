import type { EditorDocument } from "../../editor/model/types";
import type { FontCatalog } from "../../resources/fonts/types";
import type { MarkerTemplate } from "../../domain/template/primitives";

export function remapDocumentAssetIds(
  document: EditorDocument,
  assetIdMap: ReadonlyMap<string, string>,
): EditorDocument {
  const getMappedId = (oldId: string): string => {
    return assetIdMap.get(oldId) ?? oldId;
  };

  const remapMarker = (marker: MarkerTemplate): MarkerTemplate => {
    if (marker.type === "image") {
      return {
        ...marker,
        assetId: getMappedId(marker.assetId),
      };
    }
    return marker;
  };

  // 1. Remap Main template markers
  const mainTemplate = {
    ...document.mainTemplate,
    chinaMarkers: {
      holiday: remapMarker(document.mainTemplate.chinaMarkers.holiday),
      workday: remapMarker(document.mainTemplate.chinaMarkers.workday),
    },
  };

  // 2. Remap font catalog local fonts
  const fontCatalogEntries: Array<[string, FontCatalog[string]]> = Object.entries(
    document.fontCatalog,
  ).map(([key, descriptor]) => {
    if (descriptor.source.type === "local") {
      return [
        key,
        {
          ...descriptor,
          source: {
            type: "local",
            assetId: getMappedId(descriptor.source.assetId),
          },
        },
      ];
    }
    return [key, descriptor];
  });

  const fontCatalog: FontCatalog = Object.fromEntries(fontCatalogEntries);

  // 3. Remap background
  const backgroundAssetId = document.pagePreview.backgroundAssetId
    ? getMappedId(document.pagePreview.backgroundAssetId)
    : undefined;

  return {
    ...document,
    mainTemplate,
    fontCatalog,
    pagePreview: {
      ...document.pagePreview,
      backgroundAssetId,
    },
  };
}
