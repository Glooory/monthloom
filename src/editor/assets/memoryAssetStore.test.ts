import { describe, it, expect } from "vitest";
import { MemoryAssetStore } from "./memoryAssetStore";

describe("memoryAssetStore", () => {
  it("stores image file in memory and resolves binary asset with correct mime type and bytes", async () => {
    const store = new MemoryAssetStore();
    const fakeContent = new Uint8Array([137, 80, 78, 71]);
    const file = new File([fakeContent], "test.png", { type: "image/png" });

    const assetId = await store.addImage(file);
    expect(assetId).toMatch(/^editor-image-/);

    const resolved = await store.resolve(assetId);
    expect(resolved.mimeType).toBe("image/png");
    expect(new Uint8Array(resolved.bytes)).toEqual(fakeContent);
  });

  it("throws when resolving unknown assetId", async () => {
    const store = new MemoryAssetStore();
    await expect(store.resolve("unknown-id")).rejects.toThrow("Asset not found: unknown-id");
  });
});
