import type { MonthloomDatabase, StoredAsset } from "./monthloomDb";
import { db as defaultDb } from "./monthloomDb";

export class AssetRepository {
  constructor(private db: MonthloomDatabase = defaultDb) {}

  async save(asset: StoredAsset): Promise<void> {
    await this.db.assets.put(asset);
  }

  async getById(id: string): Promise<StoredAsset | null> {
    const record = await this.db.assets.get(id);
    return record ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.assets.delete(id);
  }

  async getAll(): Promise<StoredAsset[]> {
    return this.db.assets.toArray();
  }
}
