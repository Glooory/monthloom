import { describe, it, expect } from "vitest";
import { createDefaultEditorDocument } from "../../editor/state/documentStore";
import { collectReferencedAssetIds } from "./referencedAssets";
import { remapDocumentAssetIds } from "./remapAssets";

describe("Referenced assets and remapping", () => {
  it("collects and remaps all referenced asset IDs in document", () => {
    const doc = createDefaultEditorDocument();
    const docWithAssets = {
      ...doc,
      mainTemplate: {
        ...doc.mainTemplate,
        chinaMarkers: {
          ...doc.mainTemplate.chinaMarkers,
          holiday: {
            type: "image" as const,
            assetId: "old-marker-id",
            position: { anchor: "top-right" as const, offsetX: -8, offsetY: 8 },
            width: 14,
            height: 14,
            opacity: 1,
          },
        },
      },
      fontCatalog: {
        ...doc.fontCatalog,
        "custom-font": {
          family: "MyFont",
          weight: 400,
          style: "normal" as const,
          source: {
            type: "local" as const,
            assetId: "old-font-id",
          },
        },
      },
      pagePreview: {
        ...doc.pagePreview,
        backgroundAssetId: "old-bg-id",
      },
    };

    const referenced = collectReferencedAssetIds(docWithAssets);
    expect(referenced).toContain("old-marker-id");
    expect(referenced).toContain("old-font-id");
    expect(referenced).toContain("old-bg-id");
    expect(referenced).toHaveLength(3);

    const map = new Map<string, string>([
      ["old-marker-id", "new-marker-id"],
      ["old-font-id", "new-font-id"],
      ["old-bg-id", "new-bg-id"],
    ]);

    const remapped = remapDocumentAssetIds(docWithAssets, map);
    const holidayMarker = remapped.mainTemplate.chinaMarkers.holiday;
    expect(holidayMarker.type === "image" && holidayMarker.assetId).toBe("new-marker-id");
    expect(remapped.fontCatalog["custom-font"].source).toEqual({
      type: "local",
      assetId: "new-font-id",
    });
    expect(remapped.pagePreview.backgroundAssetId).toBe("new-bg-id");
  });
});
