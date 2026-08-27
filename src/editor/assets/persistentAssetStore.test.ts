import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MonthloomDatabase } from "../../persistence/db/monthloomDb";
import { PersistentAssetStore } from "./persistentAssetStore";

describe("PersistentAssetStore", () => {
  let testDb: MonthloomDatabase;
  let assetStore: PersistentAssetStore;

  beforeEach(() => {
    testDb = new MonthloomDatabase(`test-asset-store-${Date.now()}-${Math.random()}`);
    assetStore = new PersistentAssetStore(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it("stores and resolves image assets across instances", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "test.png", { type: "image/png" });
    const assetId = await assetStore.addImage(file);

    expect(assetId.startsWith("asset-")).toBe(true);

    const resolved = await assetStore.resolve(assetId);
    expect(resolved.mimeType).toBe("image/png");
    expect(new Uint8Array(resolved.bytes)).toEqual(new Uint8Array([1, 2, 3]));

    // New instance connected to same DB
    const secondStore = new PersistentAssetStore(testDb);
    const reloaded = await secondStore.resolve(assetId);
    expect(new Uint8Array(reloaded.bytes)).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("throws when resolving non-existent asset", async () => {
    await expect(assetStore.resolve("non-existent")).rejects.toThrow("Asset not found");
  });
});
