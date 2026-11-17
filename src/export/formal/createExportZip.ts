import JSZip from "jszip";
import { serializeSvg } from "../../rendering/svg/serializer";
import type { FormalRenderedDocuments } from "./types";
import type { SvgDocument } from "../../rendering/svg/document";

export async function createFormalExportZip(args: {
  documents: FormalRenderedDocuments;
  fullDocuments: ReadonlyMap<string, SvgDocument>;
}): Promise<Blob> {
  const { documents } = args;
  const zip = new JSZip();

  const mainFolder = zip.folder("main");
  const miniFolder = zip.folder("mini");
  const fullFolder = zip.folder("full");

  if (!mainFolder || !miniFolder || !fullFolder) {
    throw new Error("Failed to create folders in export ZIP");
  }

  for (const [key, doc] of args.fullDocuments) {
    fullFolder.file(`${key.replace("-", "_")}_full.svg`, serializeSvg(doc));
  }

  // 1. Add 13 Main files
  for (const [key, doc] of documents.main) {
    const svgContent = serializeSvg(doc);
    mainFolder.file(`${key.replace("-", "_")}.svg`, svgContent);
  }

  // 2. Add 15 Mini files (including 2028-2)
  for (const [key, doc] of documents.mini) {
    const svgContent = serializeSvg(doc);
    miniFolder.file(`${key.replace("-", "_")}_mini.svg`, svgContent);
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
