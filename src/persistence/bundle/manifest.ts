import { z } from "zod";

export const bundleAssetEntrySchema = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
});

export const bundleManifestSchema = z.object({
  format: z.literal("monthloom-bundle"),
  version: z.literal(2),
  type: z.enum(["project", "template"]),
  exportedAt: z.string(),
  generator: z.string(),
  assets: z.array(bundleAssetEntrySchema),
});

export type BundleManifest = z.infer<typeof bundleManifestSchema>;
export type BundleAssetEntry = z.infer<typeof bundleAssetEntrySchema>;
