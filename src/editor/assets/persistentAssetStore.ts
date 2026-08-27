import type { BinaryAsset, AssetResolver } from "../../resources/assets/types";
import { AssetRepository } from "../../persistence/db/assetRepository";
import { db as defaultDb, type MonthloomDatabase } from "../../persistence/db/monthloomDb";

async function fileToUint8Array(file: File | Blob): Promise<Uint8Array> {
  let arrayBuffer: ArrayBuffer;
  if (typeof file.arrayBuffer === "function") {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file as ArrayBuffer"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
  return new Uint8Array(arrayBuffer);
}

export class PersistentAssetStore implements AssetResolver {
  private repository: AssetRepository;
  private memoryCache = new Map<string, BinaryAsset>();

  constructor(customDb?: MonthloomDatabase) {
    this.repository = new AssetRepository(customDb ?? defaultDb);
  }

  async addImage(file: File | Blob): Promise<string> {
    const data = await fileToUint8Array(file);
    const mimeType = (file as File).type || "image/png";
    const assetId = `asset-${crypto.randomUUID()}`;

    await this.repository.save({
      id: assetId,
      mimeType,
      data,
      createdAt: new Date().toISOString(),
    });

    const binaryAsset: BinaryAsset = {
      bytes: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      mimeType,
    };
    this.memoryCache.set(assetId, binaryAsset);

    return assetId;
  }

  async setAsset(assetId: string, asset: BinaryAsset): Promise<void> {
    this.memoryCache.set(assetId, asset);
    const data = new Uint8Array(asset.bytes);
    await this.repository.save({
      id: assetId,
      mimeType: asset.mimeType,
      data,
      createdAt: new Date().toISOString(),
    });
  }

  async resolve(assetId: string): Promise<BinaryAsset> {
    const cached = this.memoryCache.get(assetId);
    if (cached) return cached;

    const stored = await this.repository.getById(assetId);
    if (!stored) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    const binaryAsset: BinaryAsset = {
      bytes: stored.data.buffer.slice(stored.data.byteOffset, stored.data.byteOffset + stored.data.byteLength),
      mimeType: stored.mimeType,
    };
    this.memoryCache.set(assetId, binaryAsset);

    return binaryAsset;
  }
}

export const persistentAssetStore = new PersistentAssetStore();
