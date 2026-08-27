import { binaryAssetToDataUri } from "../../resources/assets/dataUri";
import type { AssetResolver } from "../../resources/assets/types";

export async function resolveBackgroundDataUri(args: {
  assetId?: string;
  assetResolver: AssetResolver;
}): Promise<string | null> {
  const { assetId, assetResolver } = args;
  if (!assetId) {
    return null;
  }

  try {
    const asset = await assetResolver.resolve(assetId);
    return binaryAssetToDataUri(asset);
  } catch {
    return null;
  }
}
