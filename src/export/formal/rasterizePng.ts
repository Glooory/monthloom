import type { SvgDocument } from "../../rendering/svg/document";
import { serializeSvg } from "../../rendering/svg/serializer";
import { loadImage } from "../../resources/assets/loadImage";

export async function rasterizePng(document: SvgDocument, scale: number): Promise<Uint8Array> {
  if (![1, 2, 3].includes(scale)) throw new Error("PNG scale must be 1, 2, or 3");
  const width = Math.round(document.width * scale);
  const height = Math.round(document.height * scale);
  const canvas = window.document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable for PNG export");
  const url = URL.createObjectURL(new Blob([serializeSvg(document)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await loadImage(url);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error(`PNG export failed at ${width} × ${height}`)), "image/png"));
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
    // Release the pixel buffer before processing the next page.
    canvas.width = 0;
    canvas.height = 0;
  }
}
