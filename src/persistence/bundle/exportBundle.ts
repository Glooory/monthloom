import JSZip from "jszip";
import type { ProjectSnapshotV1 } from "../schema/projectSnapshot";
import type { TemplateSnapshotV1 } from "../schema/templateSnapshot";
import { AssetRepository } from "../db/assetRepository";
import { HolidayLibraryRepository } from "../db/holidayLibraryRepository";
import { db as defaultDb, type MonthloomDatabase } from "../db/monthloomDb";
import { collectReferencedAssetIds } from "../assets/referencedAssets";
import type { BundleAssetEntry, BundleManifest } from "./manifest";

export async function createMonthloomBundle(args: {
  snapshot: ProjectSnapshotV1 | TemplateSnapshotV1;
  db?: MonthloomDatabase;
}): Promise<Blob> {
  const { snapshot, db = defaultDb } = args;
  const assetRepo = new AssetRepository(db);
  const holidayRepo = new HolidayLibraryRepository(db);

  const referencedAssetIds = collectReferencedAssetIds(snapshot.document);
  const zip = new JSZip();

  const manifestAssets: BundleAssetEntry[] = [];

  for (const assetId of referencedAssetIds) {
    const asset = await assetRepo.getById(assetId);
    if (!asset) {
      throw new Error(`Referenced asset not found in storage: ${assetId}`);
    }
    const filename = `assets/${assetId}.bin`;
    const cleanBytes = new Uint8Array(Array.from(asset.data));
    zip.file(filename, cleanBytes);
    manifestAssets.push({
      id: assetId,
      filename,
      mimeType: asset.mimeType,
    });
  }

  const manifest: BundleManifest = {
    format: "monthloom-bundle",
    version: 2,
    type: snapshot.type,
    exportedAt: new Date().toISOString(),
    generator: "Monthloom",
    assets: manifestAssets,
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("payload.json", JSON.stringify(snapshot, null, 2));

  // For project bundles, package full global holiday library
  if (snapshot.type === "project") {
    const holidaySnapshot = await holidayRepo.getSnapshot();
    zip.file("holiday-library.json", JSON.stringify(holidaySnapshot, null, 2));
  }

  return await zip.generateAsync({ type: "blob" });
}
