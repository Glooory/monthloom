import type { MonthloomDatabase, StoredFontCache } from "./monthloomDb";
import { db as defaultDb } from "./monthloomDb";

export class FontCacheRepository {
  constructor(private db: MonthloomDatabase = defaultDb) {}

  async save(record: StoredFontCache): Promise<void> {
    await this.db.fontCache.put(record);
  }

  async getByKey(cacheKey: string): Promise<StoredFontCache | null> {
    const record = await this.db.fontCache.get(cacheKey);
    return record ?? null;
  }

  async clear(): Promise<void> {
    await this.db.fontCache.clear();
  }
}
