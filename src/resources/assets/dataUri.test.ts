import { describe, expect, it } from "vitest";
import type { BinaryAsset } from "./types";
import { binaryAssetToDataUri } from "./dataUri";

describe("binaryAssetToDataUri", () => {
  it("converts PNG bytes to data URI with correct mimeType prefix", () => {
    // Standard PNG magic bytes: 137, 80, 78, 71
    const pngBuffer = new Uint8Array([137, 80, 78, 71]).buffer;
    const asset: BinaryAsset = {
      bytes: pngBuffer,
      mimeType: "image/png",
    };

    const dataUri = binaryAssetToDataUri(asset);
    expect(dataUri.startsWith("data:image/png;base64,")).toBe(true);
    // Base64 of [137, 80, 78, 71] (0x89, 0x50, 0x4E, 0x47) is "iVBORw=="
    expect(dataUri).toBe("data:image/png;base64,iVBORw==");
  });

  it("throws descriptive error on missing or empty MIME type", () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    const assetWithEmptyMime: BinaryAsset = {
      bytes: buffer,
      mimeType: "",
    };

    expect(() => binaryAssetToDataUri(assetWithEmptyMime)).toThrow(
      /Invalid or empty MIME type/,
    );
  });
});
