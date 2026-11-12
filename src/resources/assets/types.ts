export type BinaryAsset = Readonly<{
  bytes: ArrayBuffer;
  mimeType: string;
}>;

export interface AssetResolver {
  resolve(assetId: string): Promise<BinaryAsset>;
}

export type BinaryAssetResolver = AssetResolver;

export interface BinaryAssetWriter {
  setAsset(assetId: string, asset: BinaryAsset): Promise<void> | void;
}
