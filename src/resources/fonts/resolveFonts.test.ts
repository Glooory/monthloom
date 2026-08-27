import { describe, expect, it, vi } from "vitest";
import type { FontCatalog } from "./types";
import { resolveFontEngine } from "./resolveFonts";
import type { BinaryAssetResolver } from "../assets/types";

describe("resolveFontEngine", () => {
  it("throws descriptive error when required fontId is missing from catalog", async () => {
    const catalog: FontCatalog = {};
    const requirements = new Map([["font-missing", "123"]]);

    await expect(
      resolveFontEngine({
        catalog,
        requirements,
      }),
    ).rejects.toThrow(/Missing font in catalog for fontId: "font-missing"/);
  });

  it("throws descriptive error when local font resolver is not provided", async () => {
    const catalog: FontCatalog = {
      "font-local": {
        family: "CustomFont",
        weight: 400,
        style: "normal",
        source: { type: "local", assetId: "asset-1" },
      },
    };
    const requirements = new Map([["font-local", "123"]]);

    await expect(
      resolveFontEngine({
        catalog,
        requirements,
      }),
    ).rejects.toThrow(
      /No assetResolver provided to resolve local font "font-local"/,
    );
  });

  it("resolves google fonts using fetchImpl and caches identical requests", async () => {
    const mockCss = `
      @font-face {
        font-family: 'Noto Sans';
        font-style: normal;
        font-weight: 400;
        src: url(https://fonts.gstatic.com/test.woff2) format('woff2');
      }
    `;

    // A minimal valid mock buffer (though fontkit might need real or mock face; let's spy on fetch)
    const mockFontBuffer = new Uint8Array([1, 2, 3, 4]).buffer;

    const mockFetch = vi.fn<typeof fetch>(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("fonts.googleapis.com")) {
        return {
          ok: true,
          status: 200,
          text: async () => mockCss,
        } as Response;
      }
      if (url.includes("fonts.gstatic.com")) {
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => mockFontBuffer,
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const catalog: FontCatalog = {
      "font-date": {
        family: "Noto Sans",
        weight: 400,
        style: "normal",
        source: { type: "google", family: "Noto Sans" },
      },
      "font-weekday": {
        family: "Noto Sans",
        weight: 400,
        style: "normal",
        source: { type: "google", family: "Noto Sans" },
      },
    };

    // Both font-date and font-weekday use the same family/weight/style and text
    const requirements = new Map([
      ["font-date", "123"],
      ["font-weekday", "123"],
    ]);

    try {
      await resolveFontEngine({
        catalog,
        requirements,
        fetchImpl: mockFetch,
      });
    } catch {
      // Ignore fontkit parse error on mock buffer
    }

    // Google CSS should have been fetched only ONCE because cache hit for identical concrete request
    expect(mockFetch).toHaveBeenCalledTimes(2); // 1 CSS + 1 font binary
  });

  it("resolves local font via BinaryAssetResolver", async () => {
    const mockAssetResolver: BinaryAssetResolver = {
      resolve: vi.fn(async (assetId: string) => {
        if (assetId === "asset-1") {
          return {
            bytes: new Uint8Array([1, 2, 3, 4]).buffer,
            mimeType: "font/woff2",
          };
        }
        throw new Error("Asset not found");
      }),
    };

    const catalog: FontCatalog = {
      "font-custom": {
        family: "MyFont",
        weight: 400,
        style: "normal",
        source: { type: "local", assetId: "asset-1" },
      },
    };
    const requirements = new Map([["font-custom", "ABC"]]);

    try {
      await resolveFontEngine({
        catalog,
        requirements,
        assetResolver: mockAssetResolver,
      });
    } catch {
      // Ignore fontkit parse error on mock buffer
    }

    expect(mockAssetResolver.resolve).toHaveBeenCalledWith("asset-1");
  });
});
