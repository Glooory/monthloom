import { binaryAssetToDataUri } from "../../resources/assets/dataUri";
import type { AssetResolver } from "../../resources/assets/types";

export async function resolveBackgroundDataUri(args: {
  assetId?: string;
  assetResolver: AssetResolver;
}): Promise<string | null> {
  if (!args.assetId) return null;
  return binaryAssetToDataUri(await args.assetResolver.resolve(args.assetId));
}
