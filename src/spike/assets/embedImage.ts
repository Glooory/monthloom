export function arrayBufferToDataUri(
  bytes: ArrayBuffer,
  mimeType: string,
): string {
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
