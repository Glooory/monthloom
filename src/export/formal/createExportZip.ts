import { rasterizePng } from "./rasterizePng";
import JSZip from "jszip";
import { serializeSvg } from "../../rendering/svg/serializer";
import type { FormalRenderedDocuments } from "./types";
import type { SvgDocument } from "../../rendering/svg/document";

export async function createFormalExportZip(args: {
  documents: Partial<FormalRenderedDocuments>;
  fullDocuments?: ReadonlyMap<string, SvgDocument>;
  fullSvgDocuments?: ReadonlyMap<string, SvgDocument>;
  pngScale?: number;
  rasterize?: typeof rasterizePng;
}): Promise<Blob> {
  const { documents } = args;
  const zip = new JSZip();

  for (const [key, doc] of args.fullDocuments ?? []) {
    const png = await (args.rasterize ?? rasterizePng)(doc, args.pngScale ?? 1);
    zip.file(`full/${key.replace("-", "_")}_full.png`, png);
  }

  for (const [key, doc] of args.fullSvgDocuments ?? []) {
    zip.file(`full-svg/${key.replace("-", "_")}_full.svg`, serializeSvg(doc));
  }

  for (const [key, doc] of documents.main ?? []) {
    zip.file(`main/${key.replace("-", "_")}.svg`, serializeSvg(doc));
  }

  for (const [key, doc] of documents.mini ?? []) {
    zip.file(`mini/${key.replace("-", "_")}_mini.svg`, serializeSvg(doc));
  }

  return await zip.generateAsync({ type: "blob" });
}

export function downloadExportZip(blob: Blob, targetYear: number): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Monthloom_${targetYear}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
