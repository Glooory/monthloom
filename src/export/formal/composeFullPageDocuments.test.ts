import { describe, expect, it } from "vitest";
import { getMainMonths, getMiniMonths } from "../../domain/calendar/monthSequence";
import { DEFAULT_PAGE_LAYOUT } from "../../domain/pagePreview/defaults";
import { createSvgDocument } from "../../rendering/svg/document";
import { serializeSvg } from "../../rendering/svg/serializer";
import { composeFullPageDocuments } from "./composeFullPageDocuments";

const documents = {
  main: new Map(getMainMonths(2027).map(({ year, month }) => [
    `${year}-${month}`, createSvgDocument(800, 600, [
      { kind: "path", d: `M${year} ${month}`, transform: "scale(2)" },
    ]),
  ])),
  mini: new Map(getMiniMonths(2027).map(({ year, month }) => [
    `${year}-${month}`, createSvgDocument(300, 220, [
      { kind: "path", d: `M${year} ${month}` },
    ]),
  ])),
};
const pagePreview = { layout: {
  ...DEFAULT_PAGE_LAYOUT, width: 1600, height: 1000,
  previousMini: { position: { anchor: "bottom-left" as const, offsetX: -10, offsetY: -20 } },
} };

describe("composeFullPageDocuments", () => {
  it("preserves preview dimensions, anchors, clipping and adjacent months across years", async () => {
    const full = await composeFullPageDocuments({ targetYear: 2027, documents, pagePreview });
    expect(full.size).toBe(13);
    const first = full.get("2027-1")!;
    expect(first.children).toHaveLength(3);
    expect(first.children.every((node) => node.kind === "viewport")).toBe(true);
    expect(first).toMatchObject({ width: 1600, height: 1000, viewBox: "0 0 1600 1000" });
    expect(first.children[0]).toMatchObject({ kind: "viewport", x: 760, y: 40, width: 800, height: 600,
      children: documents.main.get("2027-1")!.children });
    expect(first.children[1]).toMatchObject({ kind: "viewport", x: -10, y: 760, width: 300, height: 220,
      children: documents.mini.get("2026-12")!.children });
    expect(first.children[2]).toMatchObject({ children: documents.mini.get("2027-2")!.children });
    expect(full.get("2028-1")!.children[2]).toMatchObject({ children: documents.mini.get("2028-2")!.children });
    const xml = new DOMParser().parseFromString(serializeSvg(first), "image/svg+xml");
    expect(xml.querySelector("parsererror")).toBeNull();
    expect(xml.querySelectorAll('svg[overflow="hidden"]')).toHaveLength(3);
    expect(xml.querySelector('path[transform="scale(2)"]')).not.toBeNull();
  });

  it("excludes the preview background image while preserving the page layout", async () => {
    const full = await composeFullPageDocuments({ targetYear: 2027, documents,
      pagePreview: { ...pagePreview, backgroundAssetId: "missing-background" } });
    const withoutBackground = await composeFullPageDocuments({ targetYear: 2027, documents, pagePreview });
    expect(full).toEqual(withoutBackground);
    const xml = new DOMParser().parseFromString(serializeSvg(full.get("2027-1")!), "image/svg+xml");
    expect(xml.querySelector("image")).toBeNull();
    expect(xml.querySelector("rect")).toBeNull();
  });

  it("rejects missing calendar documents", async () => {
    await expect(composeFullPageDocuments({ targetYear: 2027,
      documents: { ...documents, mini: new Map() }, pagePreview,
    })).rejects.toThrow("Missing calendar document for full-page export: 2026-12");
  });
});
