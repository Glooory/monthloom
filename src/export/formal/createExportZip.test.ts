import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { createSvgDocument } from "../../rendering/svg/document";
import { createFormalExportZip } from "./createExportZip";
import type { FormalRenderedDocuments } from "./types";

describe("createFormalExportZip", () => {
  it("packages exactly 28 SVG files into main/ and mini/ folders with mini/2028-2.svg present", async () => {
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

    const zipBlob = await createFormalExportZip({ documents });
    const zip = await JSZip.loadAsync(zipBlob);

    // List all non-directory entries
    const files = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
    expect(files).toHaveLength(28);

    // Verify 13 Main files
    for (let m = 1; m <= 12; m++) {
      expect(zip.file(`main/2027-${m}.svg`)).not.toBeNull();
    }
    expect(zip.file("main/2028-1.svg")).not.toBeNull();

    // Verify 15 Mini files
    expect(zip.file("mini/2026-12.svg")).not.toBeNull();
    for (let m = 1; m <= 12; m++) {
      expect(zip.file(`mini/2027-${m}.svg`)).not.toBeNull();
    }
    expect(zip.file("mini/2028-1.svg")).not.toBeNull();
    expect(zip.file("mini/2028-2.svg")).not.toBeNull();
  });
});
