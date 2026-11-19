import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { createSvgDocument } from "../../rendering/svg/document";
import { createFormalExportZip } from "./createExportZip";
import { composeFullPageDocuments } from "./composeFullPageDocuments";
import { DEFAULT_PAGE_PREVIEW_CONFIG } from "../../domain/pagePreview/defaults";
import type { FormalRenderedDocuments } from "./types";

describe("createFormalExportZip", () => {
  it.each([
    { full: true, main: false, mini: false, files: ["full/2027_1_full.png"] },
    { full: false, main: true, mini: false, files: ["main/2027_1.svg"] },
    { full: false, main: false, mini: true, files: ["mini/2027_1_mini.svg"] },
    { full: true, main: true, mini: false, files: ["full/2027_1_full.png", "main/2027_1.svg"] },
    { full: true, main: false, mini: true, files: ["full/2027_1_full.png", "mini/2027_1_mini.svg"] },
    { full: false, main: true, mini: true, files: ["main/2027_1.svg", "mini/2027_1_mini.svg"] },
  ])("packages only $files", async ({ full, main, mini, files }) => {
    const docs = new Map([["2027-1", createSvgDocument(700, 500, [])]]);
    const zipBlob = await createFormalExportZip({
      documents: { main: main ? docs : undefined, mini: mini ? docs : undefined },
      fullDocuments: full ? docs : undefined,
      rasterize: async () => new Uint8Array([1]),
    });
    const zip = await JSZip.loadAsync(zipBlob);
    const entries = Object.keys(zip.files);

    expect(entries.filter((path) => !zip.files[path].dir)).toEqual(files);
    expect(entries.filter((path) => zip.files[path].dir)).toEqual(
      files.map((file) => file.split("/")[0] + "/"),
    );
  });

  it("exports full-page SVGs on their own without rasterizing them", async () => {
    const doc = createSvgDocument(700, 500, []);
    const zipBlob = await createFormalExportZip({
      documents: {},
      fullSvgDocuments: new Map([["2027-1", doc]]),
    });
    const zip = await JSZip.loadAsync(zipBlob);

    expect(Object.keys(zip.files)).toEqual(["full-svg/", "full-svg/2027_1_full.svg"]);
    expect(await zip.file("full-svg/2027_1_full.svg")!.async("string"))
      .toContain('viewBox="0 0 700 500"');
  });

  it("packages 13 full-page SVGs, 13 full-page PNGs, 13 Main SVGs and 15 Mini SVGs", async () => {
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
    const zipBlob = await createFormalExportZip({ documents, fullDocuments, fullSvgDocuments: fullDocuments, pngScale: 2,
      rasterize: async (doc, scale) => { renderedSizes.push([doc.width, doc.height, scale]); return png; },
    });
    const zip = await JSZip.loadAsync(zipBlob);

    // List all non-directory entries
    const files = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
    expect(files).toHaveLength(54);

    expect(files.filter((path) => path.startsWith("full/"))).toHaveLength(13);
    expect(zip.file("full/2027_1_full.png")).not.toBeNull();
    expect(zip.file("full/2028_1_full.png")).not.toBeNull();
    expect(await zip.file("full/2028_1_full.png")!.async("uint8array")).toEqual(png);
    expect(renderedSizes).toEqual(Array.from({ length: 13 }, () => [1400, 900, 2]));
    expect(files.filter((path) => path.startsWith("full-svg/"))).toHaveLength(13);
    expect(zip.file("full-svg/2027_1_full.svg")).not.toBeNull();
    expect(zip.file("full-svg/2028_1_full.svg")).not.toBeNull();

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
