import { binaryAssetToDataUri } from "./dataUri";
import type { AssetResolver } from "./types";
import { loadImage } from "./loadImage";
import type { PageBackground } from "../../domain/pagePreview/types";

export async function loadBackground(background: PageBackground | null, assetResolver: AssetResolver) {
  if (!background) return null;
  try {
    const uri = binaryAssetToDataUri(await assetResolver.resolve(background.assetId));
    const image = await loadImage(uri);
    return { uri, width: image.naturalWidth, height: image.naturalHeight };
  } catch (error) {
    throw new Error(`Failed to load background ${background.assetId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
