import { describe, it, expect } from "vitest";
import { createDefaultEditorDocument } from "../../editor/state/documentStore";
import { collectReferencedAssetIds } from "./referencedAssets";
import { remapDocumentAssetIds } from "./remapAssets";

describe("Referenced assets and remapping", () => {
  it("collects and remaps all referenced asset IDs in document", () => {
    const doc = createDefaultEditorDocument();
    const docWithAssets = {
      ...doc,
      holidayLayers: doc.holidayLayers.map((l, i) =>
        i === 0
          ? {
              ...l,
              main: {
                ...l.main,
                holidayMarker: {
                  ...l.main.holidayMarker,
                  marker: {
                    type: "image" as const,
                    assetId: "old-marker-id",
                    position: { anchor: "top-right" as const, offsetX: -8, offsetY: 8 },
                    width: 14,
                    height: 14,
                    opacity: 1,
                  },
                },
              },
            }
          : l,
      ),
      fontCatalog: {
        ...doc.fontCatalog,
        "custom-font": {
          family: "MyFont",
          weight: 400,
          style: "normal" as const,
          source: {
            type: "local" as const,
            assetId: "old-font-id",
            postscriptName: "MyFont-Bold",
          },
        },
      },
      pagePreview: {
        ...doc.pagePreview,
        backgroundAssetId: "old-bg-id",
        backgrounds: { "2027-1": { assetId: "month-bg", rect: { x: -10, y: 0, width: 200, height: 100 } }, "2028-1": null },
      },
    };

    const referenced = collectReferencedAssetIds(docWithAssets);
    expect(referenced).toContain("old-marker-id");
    expect(referenced).toContain("old-font-id");
    expect(referenced).toContain("old-bg-id");
    expect(referenced).toContain("month-bg");
    expect(referenced).toHaveLength(4);

    const map = new Map<string, string>([
      ["old-marker-id", "new-marker-id"],
      ["old-font-id", "new-font-id"],
      ["old-bg-id", "new-bg-id"],
      ["month-bg", "remapped-month-bg"],
    ]);

    const remapped = remapDocumentAssetIds(docWithAssets, map);
    const holidayMarker = remapped.holidayLayers[0].main.holidayMarker.marker;
    expect(holidayMarker.type === "image" && holidayMarker.assetId).toBe("new-marker-id");
    expect(remapped.fontCatalog["custom-font"].source).toEqual({
      type: "local",
      assetId: "new-font-id",
      postscriptName: "MyFont-Bold",
    });
    expect(remapped.pagePreview.backgroundAssetId).toBe("new-bg-id");
    expect(remapped.pagePreview.backgrounds).toEqual({ "2027-1": {
      assetId: "remapped-month-bg", rect: { x: -10, y: 0, width: 200, height: 100 },
    }, "2028-1": null });
  });
});
