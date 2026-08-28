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

  // 1. Remap holiday layers image markers (Main and Mini)
  const holidayLayers = document.holidayLayers?.map((layer) => ({
    ...layer,
    main: {
      ...layer.main,
      holidayMarker: {
        ...layer.main.holidayMarker,
        marker: remapMarker(layer.main.holidayMarker.marker),
      },
      workdayMarker: {
        ...layer.main.workdayMarker,
        marker: remapMarker(layer.main.workdayMarker.marker),
      },
    },
    mini: {
      ...layer.mini,
      holidayMarker: {
        ...layer.mini.holidayMarker,
        marker: remapMarker(layer.mini.holidayMarker.marker),
      },
      workdayMarker: {
        ...layer.mini.workdayMarker,
        marker: remapMarker(layer.mini.workdayMarker.marker),
      },
    },
  })) ?? [];

  // 2. Remap font catalog local fonts
  const fontCatalogEntries: Array<[string, FontCatalog[string]]> =
    Object.entries(document.fontCatalog).map(([key, descriptor]) => {
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
    holidayLayers,
    fontCatalog,
    pagePreview: {
      ...document.pagePreview,
      backgroundAssetId,
    },
  };
}
