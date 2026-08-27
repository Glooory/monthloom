import JSZip from "jszip";
import { serializeSvg } from "../../rendering/svg/serializer";
import type { FormalRenderedDocuments } from "./types";

export async function createFormalExportZip(args: {
  documents: FormalRenderedDocuments;
}): Promise<Blob> {
  const { documents } = args;
  const zip = new JSZip();

  const mainFolder = zip.folder("main");
  const miniFolder = zip.folder("mini");

  if (!mainFolder || !miniFolder) {
    throw new Error("Failed to create folders in export ZIP");
  }

  // 1. Add 13 Main files
  for (const [key, doc] of documents.main) {
    const svgContent = serializeSvg(doc);
    mainFolder.file(`${key}.svg`, svgContent);
  }

  // 2. Add 15 Mini files (including 2028-2)
  for (const [key, doc] of documents.mini) {
    const svgContent = serializeSvg(doc);
    miniFolder.file(`${key}.svg`, svgContent);
  }

  return await zip.generateAsync({ type: "blob" });
}

export function downloadExportZip(blob: Blob, targetYear: number): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Monthloom-${targetYear}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
