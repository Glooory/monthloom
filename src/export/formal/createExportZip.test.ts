import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { createSvgDocument } from "../../rendering/svg/document";
import { createFormalExportZip } from "./createExportZip";
import { composeFullPageDocuments } from "./composeFullPageDocuments";
import { DEFAULT_PAGE_PREVIEW_CONFIG } from "../../domain/pagePreview/defaults";
import type { FormalRenderedDocuments } from "./types";

describe("createFormalExportZip", () => {
  it("packages exactly 28 SVG and 13 PNG files into full/, main/ and mini/ folders with mini/2028_2_mini.svg present", async () => {
    const mainDocs = new Map();
    for (let m = 1; m <= 12; m++) {
      mainDocs.set(`2027-${m}`, createSvgDocument(700, 500, []));
    }
    mainDocs.set("2028-1", createSvgDocument(700, 500, []));

    const miniDocs = new Map();
    miniDocs.set("2026-12", createSvgDocument(280, 210, []));
    for (let m = 1; m <= 12; m++) {
      miniDocs.set(`2027-${m}`, createSvgDocument(280, 210, []));
    }
    miniDocs.set("2028-1", createSvgDocument(280, 210, []));
    miniDocs.set("2028-2", createSvgDocument(280, 210, []));

    const documents: FormalRenderedDocuments = {
      main: mainDocs,
      mini: miniDocs,
    };

    const fullDocuments = await composeFullPageDocuments({
      targetYear: 2027, documents, pagePreview: DEFAULT_PAGE_PREVIEW_CONFIG,
    });
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    const renderedSizes: number[][] = [];
    const zipBlob = await createFormalExportZip({ documents, fullDocuments, pngScale: 2,
      rasterize: async (doc, scale) => { renderedSizes.push([doc.width, doc.height, scale]); return png; },
    });
    const zip = await JSZip.loadAsync(zipBlob);

    // List all non-directory entries
    const files = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
    expect(files).toHaveLength(41);

    expect(files.filter((path) => path.startsWith("full/"))).toHaveLength(13);
    expect(zip.file("full/2027_1_full.png")).not.toBeNull();
    expect(zip.file("full/2028_1_full.png")).not.toBeNull();
    expect(await zip.file("full/2028_1_full.png")!.async("uint8array")).toEqual(png);
    expect(renderedSizes).toEqual(Array.from({ length: 13 }, () => [1400, 900, 2]));
    expect(files.filter((path) => path.endsWith(".svg"))).toHaveLength(28);

    // Verify 13 Main files
    for (let m = 1; m <= 12; m++) {
      expect(zip.file(`main/2027_${m}.svg`)).not.toBeNull();
    }
    expect(zip.file("main/2028_1.svg")).not.toBeNull();

    // Verify 15 Mini files
    expect(zip.file("mini/2026_12_mini.svg")).not.toBeNull();
    for (let m = 1; m <= 12; m++) {
      expect(zip.file(`mini/2027_${m}_mini.svg`)).not.toBeNull();
    }
    expect(zip.file("mini/2028_1_mini.svg")).not.toBeNull();
    expect(zip.file("mini/2028_2_mini.svg")).not.toBeNull();
  });
});
