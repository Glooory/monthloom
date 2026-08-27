import type { SvgDocument } from "./document";
import { serializeSvg } from "./serializer";

export function createSvgBlob(document: SvgDocument): Blob {
  const xml = serializeSvg(document);
  return new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
}

export function downloadSvg(args: {
  document: SvgDocument;
  filename: string;
}): void {
  const { document, filename } = args;
  const blob = createSvgBlob(document);
  const url = URL.createObjectURL(blob);

  const a = globalThis.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
