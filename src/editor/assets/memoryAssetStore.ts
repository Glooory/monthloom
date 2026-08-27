import type { BinaryAsset, AssetResolver } from "../../resources/assets/types";

async function fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return await file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
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

export class MemoryAssetStore implements AssetResolver {
  private assets = new Map<string, BinaryAsset>();

  async addImage(file: File | Blob): Promise<string> {
    const bytes = await fileToArrayBuffer(file);
    const assetId = `editor-image-${crypto.randomUUID()}`;
    this.assets.set(assetId, {
      bytes,
      mimeType: (file as File).type || "image/png",
    });
    return assetId;
  }

  setAsset(assetId: string, asset: BinaryAsset): void {
    this.assets.set(assetId, asset);
  }

  async resolve(assetId: string): Promise<BinaryAsset> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    return asset;
  }
}

export const memoryAssetStore = new MemoryAssetStore();
