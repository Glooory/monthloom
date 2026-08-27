export function arrayBufferToDataUri(
  bytes: ArrayBuffer | Uint8Array,
  mimeType: string,
): string {
  const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
