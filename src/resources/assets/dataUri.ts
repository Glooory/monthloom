import type { BinaryAsset } from "./types";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function binaryAssetToDataUri(asset: BinaryAsset): string {
  if (!asset.mimeType || asset.mimeType.trim() === "") {
    throw new Error("Invalid or empty MIME type for binary asset");
  }

  const bytes = new Uint8Array(asset.bytes);
  const base64 = uint8ArrayToBase64(bytes);
  return `data:${asset.mimeType};base64,${base64}`;
}
