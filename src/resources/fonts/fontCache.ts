import { FontCacheRepository } from "../../persistence/db/fontCacheRepository";
import { db as defaultDb, type MonthloomDatabase } from "../../persistence/db/monthloomDb";

export class PersistentFontCache {
  private repository: FontCacheRepository;

  constructor(customDb?: MonthloomDatabase) {
    this.repository = new FontCacheRepository(customDb ?? defaultDb);
  }

  async get(cacheKey: string): Promise<ArrayBuffer | null> {
    if (typeof indexedDB === "undefined") return null;
    try {
      const record = await this.repository.getByKey(cacheKey);
      if (!record) return null;
      return record.binary.buffer.slice(
        record.binary.byteOffset,
        record.binary.byteOffset + record.binary.byteLength,
      );
    } catch {
      return null;
    }
  }

  async set(
    cacheKey: string,
    meta: { family: string; weight: number; style: string; format: string },
    bytes: ArrayBuffer,
  ): Promise<void> {
    if (typeof indexedDB === "undefined") return;
    try {
      await this.repository.save({
        cacheKey,
        family: meta.family,
        weight: meta.weight,
        style: meta.style,
        format: meta.format,
        binary: new Uint8Array(bytes),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Graceful fallback if cache write fails
    }
  }
}

export const persistentFontCache = new PersistentFontCache();
