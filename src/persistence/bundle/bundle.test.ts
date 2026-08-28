import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MonthloomDatabase } from "../db/monthloomDb";
import { AssetRepository } from "../db/assetRepository";
import { ProjectRepository } from "../db/projectRepository";
import { HolidayLibraryRepository } from "../db/holidayLibraryRepository";
import { createDefaultEditorDocument } from "../../editor/state/documentStore";
import { base, overrideUpsert } from "../../domain/holiday/testFixtures";
import { BUILTIN_CHINA_CALENDAR_ID } from "../../domain/holiday/types";
import type { ProjectSnapshotV1 } from "../schema/projectSnapshot";

import { createMonthloomBundle } from "./exportBundle";
import { importMonthloomBundle } from "./importBundle";

describe(".monthloom Bundle Roundtrip", () => {
  let sourceDb: MonthloomDatabase;
  let targetDb: MonthloomDatabase;

  beforeEach(() => {
    sourceDb = new MonthloomDatabase(
      `source-db-${Date.now()}-${Math.random()}`,
    );
    targetDb = new MonthloomDatabase(
      `target-db-${Date.now()}-${Math.random()}`,
    );
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
      holidayLayers: defaultDoc.holidayLayers.map((l, i) =>
        i === 0
          ? {
              ...l,
              main: {
                ...l.main,
                holidayMarker: {
                  ...l.main.holidayMarker,
                  marker: {
                    type: "image" as const,
                    assetId: "source-marker-1",
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
    };

    const project: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "source-proj-1",
      name: "Source Project",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
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
    const holidayMarker = loaded?.document.holidayLayers[0].main.holidayMarker.marker;
    const newAssetId =
      holidayMarker?.type === "image" ? holidayMarker.assetId : undefined;
    expect(newAssetId).toBeDefined();
    expect(newAssetId).not.toBe("source-marker-1");

    // 4. Verify asset was copied and can be retrieved
    const targetAssetRepo = new AssetRepository(targetDb);
    const remappedAsset = await targetAssetRepo.getById(newAssetId!);
    expect(remappedAsset).not.toBeNull();
    expect(Array.from(remappedAsset?.data ?? [])).toEqual(
      Array.from(assetBytes),
    );
  });

  it("exports full holiday library in project bundle and merges non-destructively on import", async () => {
    // 1. Seed source DB with custom calendar and holiday records
    const sourceHolidayRepo = new HolidayLibraryRepository(sourceDb);
    await sourceHolidayRepo.ensureBuiltins();
    await sourceHolidayRepo.upsertCalendar({
      id: "source-custom-cal",
      name: "Source Custom",
      builtin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await sourceHolidayRepo.applyBaseUpdate({
      calendarId: "source-custom-cal",
      records: [
        base("source-custom-cal", "2027-01-01", "holiday", "Special Day"),
      ],
      coverage: [],
      replacementRanges: [],
    });

    // 2. Target DB has local override on the same date for built-in calendar
    const targetHolidayRepo = new HolidayLibraryRepository(targetDb);
    await targetHolidayRepo.ensureBuiltins();
    await targetHolidayRepo.putOverride(
      overrideUpsert(
        BUILTIN_CHINA_CALENDAR_ID,
        "2027-01-01",
        "holiday",
        "Target Local Override",
      ),
    );

    const project: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "source-proj-holiday",
      name: "Holiday Project",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
      document: createDefaultEditorDocument(),
    };

    const bundleBlob = await createMonthloomBundle({
      snapshot: project,
      db: sourceDb,
    });

    // 3. Import bundle into targetDb
    const importResult = await importMonthloomBundle({
      bundleData: bundleBlob,
      db: targetDb,
    });
    expect(importResult.type).toBe("project");
    expect(importResult.holidaySummary).toBeDefined();
    expect(importResult.holidaySummary?.addedCalendars).toBe(1);
    expect(importResult.holidaySummary?.addedRecords).toBe(1);
    expect(importResult.holidaySummary?.skippedOverrideConflicts).toBe(0);

    // 4. Verify targetDb now has the custom calendar from source
    const targetSnapshot = await targetHolidayRepo.getSnapshot();
    expect(targetSnapshot.calendars.map((c) => c.id)).toContain(
      "source-custom-cal",
    );

    // 5. Verify local override in targetDb was preserved
    const targetLocalOverride = targetSnapshot.overrides.find(
      (o) => o.id === `${BUILTIN_CHINA_CALENDAR_ID}:2027-01-01`,
    );
    expect((targetLocalOverride as any)?.name).toBe("Target Local Override");
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
      holidayLayers: defaultDoc.holidayLayers.map((l, i) =>
        i === 0
          ? {
              ...l,
              main: {
                ...l.main,
                holidayMarker: {
                  ...l.main.holidayMarker,
                  marker: {
                    type: "image" as const,
                    assetId: "source-marker-atomic",
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
    };

    const project: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "source-proj-atomic",
      name: "Source Project",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
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

  it("rejects project bundle missing holiday-library.json", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file(
      "manifest.json",
      JSON.stringify({
        format: "monthloom-bundle",
        version: 2,
        type: "project",
        exportedAt: new Date().toISOString(),
        generator: "Monthloom",
        assets: [],
      }),
    );
    const defaultDoc = createDefaultEditorDocument();
    zip.file(
      "payload.json",
      JSON.stringify({
        version: 1,
        type: "project",
        id: "proj-no-holiday",
        name: "No Holiday Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetYear: 2027,
        document: defaultDoc,
      }),
    );

    const blob = await zip.generateAsync({ type: "blob" });
    await expect(
      importMonthloomBundle({
        bundleData: blob,
        db: targetDb,
      }),
    ).rejects.toThrow(/missing holiday-library.json/);
  });

  it("rejects bundle with manifest v1", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file(
      "manifest.json",
      JSON.stringify({
        format: "monthloom-bundle",
        version: 1,
        type: "project",
        exportedAt: new Date().toISOString(),
        generator: "Monthloom",
        assets: [],
      }),
    );
    zip.file("payload.json", JSON.stringify({}));
    const blob = await zip.generateAsync({ type: "blob" });

    await expect(
      importMonthloomBundle({
        bundleData: blob,
        db: targetDb,
      }),
    ).rejects.toThrow(/Invalid .monthloom manifest/);
  });
});
