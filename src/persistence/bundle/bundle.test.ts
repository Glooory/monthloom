import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MonthloomDatabase } from "../db/monthloomDb";
import { AssetRepository } from "../db/assetRepository";
import { ProjectRepository } from "../db/projectRepository";
import { createDefaultEditorDocument } from "../../editor/state/documentStore";
import type { ProjectSnapshotV1 } from "../schema/projectSnapshot";
import { createMonthloomBundle } from "./exportBundle";
import { importMonthloomBundle } from "./importBundle";

describe(".monthloom Bundle Roundtrip", () => {
  let sourceDb: MonthloomDatabase;
  let targetDb: MonthloomDatabase;

  beforeEach(() => {
    sourceDb = new MonthloomDatabase(`source-db-${Date.now()}-${Math.random()}`);
    targetDb = new MonthloomDatabase(`target-db-${Date.now()}-${Math.random()}`);
  });

  afterEach(async () => {
    await sourceDb.delete();
    await targetDb.delete();
  });

  it("exports and imports a project bundle with referenced assets intact and remapped", async () => {
    const assetRepo = new AssetRepository(sourceDb);
    const assetBytes = new Uint8Array([10, 20, 30, 40]);
    await assetRepo.save({
      id: "source-marker-1",
      mimeType: "image/png",
      data: assetBytes,
      createdAt: new Date().toISOString(),
    });

    const defaultDoc = createDefaultEditorDocument();
    const docWithAsset = {
      ...defaultDoc,
      mainTemplate: {
        ...defaultDoc.mainTemplate,
        chinaMarkers: {
          ...defaultDoc.mainTemplate.chinaMarkers,
          holiday: {
            type: "image" as const,
            assetId: "source-marker-1",
            position: { anchor: "top-right" as const, offsetX: -8, offsetY: 8 },
            width: 14,
            height: 14,
            opacity: 1,
          },
        },
      },
    };

    const project: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "source-proj-1",
      name: "Source Project",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
      chinaHolidayDataset: null,
      japanHolidayDataset: null,
      document: docWithAsset,
    };

    // 1. Export bundle
    const bundleBlob = await createMonthloomBundle({
      snapshot: project,
      db: sourceDb,
    });
    expect(bundleBlob.size).toBeGreaterThan(0);

    // 2. Import into separate target DB
    const importResult = await importMonthloomBundle({
      bundleData: bundleBlob,
      db: targetDb,
    });

    expect(importResult.type).toBe("project");
    expect(importResult.id).not.toBe("source-proj-1");
    expect(importResult.name).toBe("Source Project");

    // 3. Verify project in target DB
    const targetProjectRepo = new ProjectRepository(targetDb);
    const loaded = await targetProjectRepo.getById(importResult.id);
    expect(loaded).not.toBeNull();
    const holidayMarker = loaded?.document.mainTemplate.chinaMarkers.holiday;
    const newAssetId = holidayMarker?.type === "image" ? holidayMarker.assetId : undefined;
    expect(newAssetId).toBeDefined();
    expect(newAssetId).not.toBe("source-marker-1");

    // 4. Verify asset was copied and can be retrieved
    const targetAssetRepo = new AssetRepository(targetDb);
    const remappedAsset = await targetAssetRepo.getById(newAssetId!);
    expect(remappedAsset).not.toBeNull();
    expect(Array.from(remappedAsset?.data ?? [])).toEqual(Array.from(assetBytes));
  });

  it("fails atomically when a corrupted or invalid bundle is imported", async () => {
    const invalidZip = new Uint8Array([0, 1, 2, 3]);
    await expect(
      importMonthloomBundle({
        bundleData: invalidZip,
        db: targetDb,
      }),
    ).rejects.toThrow();

    // Verify targetDb has 0 projects and 0 assets
    const targetProjectRepo = new ProjectRepository(targetDb);
    const targetAssetRepo = new AssetRepository(targetDb);
    expect(await targetProjectRepo.list()).toHaveLength(0);
    expect(await targetAssetRepo.getAll()).toHaveLength(0);
  });

  it("rolls back all assets if project saving fails within transaction", async () => {
    const assetRepo = new AssetRepository(sourceDb);
    await assetRepo.save({
      id: "source-marker-atomic",
      mimeType: "image/png",
      data: new Uint8Array([1, 2, 3]),
      createdAt: new Date().toISOString(),
    });

    const defaultDoc = createDefaultEditorDocument();
    const docWithAsset = {
      ...defaultDoc,
      mainTemplate: {
        ...defaultDoc.mainTemplate,
        chinaMarkers: {
          ...defaultDoc.mainTemplate.chinaMarkers,
          holiday: {
            type: "image" as const,
            assetId: "source-marker-atomic",
            position: { anchor: "top-right" as const, offsetX: -8, offsetY: 8 },
            width: 14,
            height: 14,
            opacity: 1,
          },
        },
      },
    };

    const project: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "source-proj-atomic",
      name: "Source Project",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
      chinaHolidayDataset: null,
      japanHolidayDataset: null,
      document: docWithAsset,
    };

    const bundleBlob = await createMonthloomBundle({
      snapshot: project,
      db: sourceDb,
    });

    // Mock projectRepo save failure on targetDb to test transaction rollback
    const originalPut = targetDb.projects.put.bind(targetDb.projects);
    targetDb.projects.put = (() => {
      throw new Error("Simulated storage write error");
    }) as unknown as typeof targetDb.projects.put;

    await expect(
      importMonthloomBundle({
        bundleData: bundleBlob,
        db: targetDb,
      }),
    ).rejects.toThrow("Simulated storage write error");

    // Restore method
    targetDb.projects.put = originalPut;

    // Verify 0 assets and 0 projects persisted in targetDb due to transaction rollback
    const targetAssetRepo = new AssetRepository(targetDb);
    const targetProjectRepo = new ProjectRepository(targetDb);
    expect(await targetAssetRepo.getAll()).toHaveLength(0);
    expect(await targetProjectRepo.list()).toHaveLength(0);
  });
});
