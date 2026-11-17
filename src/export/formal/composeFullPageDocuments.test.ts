import { describe, expect, it, vi } from "vitest";
import { getMainMonths, getMiniMonths } from "../../domain/calendar/monthSequence";
import { DEFAULT_PAGE_LAYOUT } from "../../domain/pagePreview/defaults";
import { createSvgDocument } from "../../rendering/svg/document";
import { serializeSvg } from "../../rendering/svg/serializer";
import { composeFullPageDocuments } from "./composeFullPageDocuments";

vi.mock("../../resources/assets/loadImage", () => ({
  loadImage: async () => ({ naturalWidth: 200, naturalHeight: 100 }),
}));

const assetResolver = { resolve: async () => ({ bytes: new Uint8Array([1, 2]).buffer, mimeType: "image/png" }) };

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

  it("embeds each month's background behind calendars, including legacy cover and explicit clearing", async () => {
    const rect = { x: -20, y: 30, width: 2000, height: 1000 };
    const full = await composeFullPageDocuments({ targetYear: 2027, documents, assetResolver,
      pagePreview: { ...pagePreview, backgroundAssetId: "shared", backgrounds: {
        "2027-1": { assetId: "january", rect }, "2027-2": null,
        "2028-1": { assetId: "next-january", rect: { ...rect, x: 40 } },
      } } });
    expect(full.get("2027-1")!.children[0]).toMatchObject({ kind: "image", ...rect });
    expect(full.get("2027-2")!.children).toHaveLength(3);
    expect(full.get("2027-3")!.children[0]).toMatchObject({ kind: "image", x: -200, y: 0, width: 2000, height: 1000 });
    expect(full.get("2028-1")!.children[0]).toMatchObject({ kind: "image", x: 40 });
    expect(documents.main.get("2027-1")!.children.every((node) => node.kind !== "image")).toBe(true);
    const xml = new DOMParser().parseFromString(serializeSvg(full.get("2027-1")!), "image/svg+xml");
    expect(xml.querySelector("image")?.getAttribute("href")).toMatch(/^data:image\/png;base64,/);
  });

  it("rejects missing backgrounds instead of silently omitting them", async () => {
    await expect(composeFullPageDocuments({ targetYear: 2027, documents,
      pagePreview: { ...pagePreview, backgroundAssetId: "missing" },
      assetResolver: { resolve: async () => { throw new Error("Missing asset"); } },
    })).rejects.toThrow("Failed to load background missing");
  });

  it("rejects missing calendar documents", async () => {
    await expect(composeFullPageDocuments({ targetYear: 2027,
      documents: { ...documents, mini: new Map() }, pagePreview,
    })).rejects.toThrow("Missing calendar document for full-page export: 2026-12");
  });
});
