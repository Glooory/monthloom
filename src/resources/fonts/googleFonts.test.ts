import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleFontsCssUrl,
  extractGoogleFontBinaryUrl,
  fetchGoogleFontBinary,
  type GoogleFontFaceRequest,
} from "./googleFonts";

describe("Production Google Fonts Provider", () => {
  it("builds CSS2 URL for normal and italic font face requests", () => {
    const normalReq: GoogleFontFaceRequest = {
      family: "Noto Sans JP",
      weight: 400,
      style: "normal",
      text: "31春节憲法記念日",
    };

    const normalUrl = buildGoogleFontsCssUrl(normalReq);
    expect(normalUrl).toContain("fonts.googleapis.com/css2");
    expect(normalUrl).toContain("family=Noto+Sans+JP:wght@400");
    expect(normalUrl).toContain(`text=${encodeURIComponent("31春节憲法記念日")}`);

    const italicReq: GoogleFontFaceRequest = {
      family: "Roboto",
      weight: 700,
      style: "italic",
      text: "123",
    };

    const italicUrl = buildGoogleFontsCssUrl(italicReq);
    expect(italicUrl).toContain("family=Roboto:ital,wght@1,700");
    expect(italicUrl).toContain(`text=${encodeURIComponent("123")}`);
  });

  it("extracts font binary URL from Google Fonts CSS response", () => {
    const css = `
      @font-face {
        font-family: 'Noto Sans JP';
        font-style: normal;
        font-weight: 400;
        src: url(https://fonts.gstatic.com/s/notosansjp/v53/-F62fjtqLzK2oHiWV4TCZScfc-K7.woff2) format('woff2');
      }
    `;

    const binaryUrl = extractGoogleFontBinaryUrl(css);
    expect(binaryUrl).toBe(
      "https://fonts.gstatic.com/s/notosansjp/v53/-F62fjtqLzK2oHiWV4TCZScfc-K7.woff2",
    );
  });

  it("throws descriptive error when CSS response contains no font URL", () => {
    const invalidCss = `/* no font face */`;
    expect(() => extractGoogleFontBinaryUrl(invalidCss)).toThrow(
      /No font binary URL found in CSS response/,
    );
  });

  it("fetches CSS first then font binary bytes using injected fetchImpl", async () => {
    const mockCss = `
      @font-face {
        font-family: 'Noto Sans';
        font-style: normal;
        font-weight: 400;
        src: url(https://fonts.gstatic.com/test.woff2) format('woff2');
      }
    `;

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
      if (url.includes("fonts.gstatic.com/test.woff2")) {
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => mockFontBuffer,
        } as Response;
      }
      return {
        ok: false,
        status: 404,
      } as Response;
    });

    const request: GoogleFontFaceRequest = {
      family: "Noto Sans",
      weight: 400,
      style: "normal",
      text: "test",
    };

    const bytes = await fetchGoogleFontBinary(request, mockFetch);
    expect(bytes).toBe(mockFontBuffer);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(String(mockFetch.mock.calls[0][0])).toContain("fonts.googleapis.com");
    expect(String(mockFetch.mock.calls[1][0])).toContain("fonts.gstatic.com/test.woff2");
  });

  it("throws descriptive error on CSS fetch failure or Font binary fetch failure", async () => {
    const failingCssFetch = vi.fn<typeof fetch>(async () => {
      return {
        ok: false,
        status: 500,
      } as Response;
    });

    const request: GoogleFontFaceRequest = {
      family: "Noto Sans",
      weight: 400,
      style: "normal",
      text: "test",
    };

    await expect(fetchGoogleFontBinary(request, failingCssFetch)).rejects.toThrow(
      /Failed to fetch Google Fonts CSS: HTTP 500 for Noto Sans/,
    );
  });

  it("rejects Lato 500 before requesting a face Google Fonts does not serve", async () => {
    const mockFetch = vi.fn<typeof fetch>();
    await expect(fetchGoogleFontBinary({
      family: "Lato", weight: 500, style: "normal", text: "1234567890",
    }, mockFetch)).rejects.toThrow(/Lato.*500.*unavailable/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("includes a space when requesting text that the face might not support", async () => {
    const mockFetch = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input));
      if (url.hostname === "fonts.googleapis.com") {
        const readable = url.searchParams.get("text")?.includes(" ");
        return { ok: true, text: async () => `src: url(https://fonts.gstatic.com/${readable ? "font" : "empty"});` } as Response;
      }
      return { ok: url.pathname === "/font", status: url.pathname === "/font" ? 200 : 400,
        arrayBuffer: async () => new ArrayBuffer(1) } as Response;
    });
    await expect(fetchGoogleFontBinary({
      family: "Roboto Mono", weight: 400, style: "normal", text: "劳动节",
    }, mockFetch)).resolves.toBeInstanceOf(ArrayBuffer);
    expect(new URL(String(mockFetch.mock.calls[0][0])).searchParams.get("text")).toBe("劳动节 ");
  });

  it("aborts a stalled download so recovery does not stay pending forever", async () => {
    vi.useFakeTimers();
    try {
      const stalled = vi.fn<typeof fetch>((_input, options) => new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }));
      const result = expect(fetchGoogleFontBinary({
        family: "Noto Sans", weight: 400, style: "normal", text: "012",
      }, stalled)).rejects.toThrow(/timed out.*Noto Sans/);
      await vi.advanceTimersByTimeAsync(15000);
      await result;
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
