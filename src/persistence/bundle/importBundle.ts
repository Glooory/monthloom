import JSZip from "jszip";
import { bundleManifestSchema, type BundleManifest } from "./manifest";
import {
  validateHolidayLibrarySnapshot,
  validateProjectSnapshot,
  validateTemplateSnapshot,
} from "../schema/validation";
import {
  mergeHolidayLibraries,
  type HolidayMergeSummary,
} from "../../domain/holiday/mergeLibrary";
import { remapDocumentAssetIds } from "../assets/remapAssets";
import { AssetRepository } from "../db/assetRepository";
import { HolidayLibraryRepository } from "../db/holidayLibraryRepository";
import { ProjectRepository } from "../db/projectRepository";
import { TemplateRepository } from "../db/templateRepository";
import {
  db as defaultDb,
  type MonthloomDatabase,
  type StoredAsset,
} from "../db/monthloomDb";

export type ImportResult = {
  type: "project" | "template";
  id: string;
  name: string;
  holidaySummary?: HolidayMergeSummary;
  skippedManualConflicts?: number;
};


export async function importMonthloomBundle(args: {
  bundleData: Blob | ArrayBuffer | Uint8Array;
  db?: MonthloomDatabase;
}): Promise<ImportResult> {
  const { bundleData, db = defaultDb } = args;

  const zip = await JSZip.loadAsync(bundleData);

  // 1. Read & validate manifest
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    throw new Error("Invalid .monthloom bundle: missing manifest.json");
  }
  const manifestText = await manifestFile.async("string");
  let manifest: BundleManifest;
  try {
    const raw = JSON.parse(manifestText);
    manifest = bundleManifestSchema.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid .monthloom manifest: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 2. Read & validate payload
  const payloadFile = zip.file("payload.json");
  if (!payloadFile) {
    throw new Error("Invalid .monthloom bundle: missing payload.json");
  }
  const payloadText = await payloadFile.async("string");
  const rawPayload = JSON.parse(payloadText);

  // 3. Read and verify all declared assets into memory
  const assetBuffers: Array<{
    originalId: string;
    mimeType: string;
    data: Uint8Array;
  }> = [];
  for (const assetEntry of manifest.assets) {
    const file = zip.file(assetEntry.filename);
    if (!file) {
      throw new Error(
        `Missing declared bundle asset file: ${assetEntry.filename}`,
      );
    }
    const data = await file.async("uint8array");
    assetBuffers.push({
      originalId: assetEntry.id,
      mimeType: assetEntry.mimeType,
      data,
    });
  }

  // 4. Create new asset IDs and remap
  const assetIdMap = new Map<string, string>();
  const assetsToSave: StoredAsset[] = [];
  const now = new Date().toISOString();

  for (const item of assetBuffers) {
    const newId = `asset-${crypto.randomUUID()}`;
    assetIdMap.set(item.originalId, newId);
    assetsToSave.push({
      id: newId,
      mimeType: item.mimeType,
      data: item.data,
      createdAt: now,
    });
  }

  const assetRepo = new AssetRepository(db);
  const projectRepo = new ProjectRepository(db);
  const templateRepo = new TemplateRepository(db);
  const holidayRepo = new HolidayLibraryRepository(db);

  if (manifest.type === "project") {
    const validatedProject = validateProjectSnapshot(rawPayload);
    const remappedDocument = remapDocumentAssetIds(
      validatedProject.document,
      assetIdMap,
    );
    const newProjectId = `project-${crypto.randomUUID()}`;

    // Require holiday-library.json in project bundle
    const holidayFile = zip.file("holiday-library.json");
    if (!holidayFile) {
      throw new Error(
        "Invalid .monthloom project bundle: missing holiday-library.json",
      );
    }
    const holidayText = await holidayFile.async("string");
    const rawHoliday = JSON.parse(holidayText);
    const incomingHoliday = validateHolidayLibrarySnapshot(rawHoliday);

    let holidaySummary: HolidayMergeSummary | undefined;

    await db.transaction(
      "rw",
      [
        db.assets,
        db.projects,
        db.holidayCalendars,
        db.holidayBaseRecords,
        db.holidayOverrides,
        db.holidayCoverage,
        db.holidaySyncStates,
      ],
      async () => {
        // 1. Ensure builtins & merge holiday library within this transaction
        await holidayRepo.ensureBuiltins();
        const localHoliday = await holidayRepo.getSnapshot();
        const mergeResult = mergeHolidayLibraries(localHoliday, incomingHoliday);
        holidaySummary = mergeResult.summary;
        await holidayRepo.restoreSnapshot(mergeResult.merged);

        // 2. Save all assets
        for (const asset of assetsToSave) {
          await assetRepo.save(asset);
        }

        // 3. Save project
        await projectRepo.save({
          ...validatedProject,
          id: newProjectId,
          updatedAt: now,
          document: remappedDocument,
        });
      },
    );

    return {
      type: "project",
      id: newProjectId,
      name: validatedProject.name,
      holidaySummary,
      skippedManualConflicts: holidaySummary?.skippedOverrideConflicts ?? 0,
    };
  } else {

    const validatedTemplate = validateTemplateSnapshot(rawPayload);
    const remappedDocument = remapDocumentAssetIds(
      validatedTemplate.document,
      assetIdMap,
    );
    const newTemplateId = `template-${crypto.randomUUID()}`;

    await db.transaction("rw", [db.assets, db.templates], async () => {
      // Save all assets
      for (const asset of assetsToSave) {
        await assetRepo.save(asset);
      }

      // Save template
      await templateRepo.save({
        ...validatedTemplate,
        id: newTemplateId,
        updatedAt: now,
        document: remappedDocument,
      });
    });

    return {
      type: "template",
      id: newTemplateId,
      name: validatedTemplate.name,
    };
  }
}
