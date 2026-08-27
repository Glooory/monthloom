import Dexie, { type EntityTable } from "dexie";
import type { ProjectSnapshotV1 } from "../schema/projectSnapshot";
import type { TemplateSnapshotV1 } from "../schema/templateSnapshot";

export type StoredAsset = {
  id: string;
  mimeType: string;
  data: Uint8Array;
  createdAt: string;
};

export type StoredFontCache = {
  cacheKey: string;
  family: string;
  weight: number;
  style: string;
  format: string;
  binary: Uint8Array;
  updatedAt: string;
};

export class MonthloomDatabase extends Dexie {
  projects!: EntityTable<ProjectSnapshotV1, "id">;
  templates!: EntityTable<TemplateSnapshotV1, "id">;
  assets!: EntityTable<StoredAsset, "id">;
  fontCache!: EntityTable<StoredFontCache, "cacheKey">;

  constructor(dbName = "MonthloomDB") {
    super(dbName);
    this.version(1).stores({
      projects: "id, name, targetYear, updatedAt",
      templates: "id, name, updatedAt",
      assets: "id, mimeType, createdAt",
      fontCache: "cacheKey, family, weight, style, format, updatedAt",
    });
  }
}

export const db = new MonthloomDatabase();
