import { describe, expect, it } from "vitest";
import { buildGoogleFontsCssUrl, extractFontUrl } from "./googleFonts";

describe("buildGoogleFontsCssUrl", () => {
  it("builds correct Google Fonts CSS2 URL with text subsetting", () => {
    const url = buildGoogleFontsCssUrl({
      family: "Noto Sans JP",
      weight: 400,
      style: "normal",
      text: "31春节憲法記念日",
    });

    expect(url).toContain("https://fonts.googleapis.com/css2?");
    expect(url).toContain("family=Noto+Sans+JP:wght@400");
    expect(url).toContain(`text=${encodeURIComponent("31春节憲法記念日")}`);
  });

  it("builds URL without text parameter when not provided", () => {
    const url = buildGoogleFontsCssUrl({
      family: "Noto Sans",
      weight: 700,
      style: "italic",
    });

    expect(url).toContain("family=Noto+Sans:ital,wght@1,700");
    expect(url).not.toContain("text=");
  });
});

describe("extractFontUrl", () => {
  it("extracts font binary URL from @font-face CSS", () => {
    const css = `
      @font-face {
        font-family: 'Noto Sans JP';
        font-style: normal;
        font-weight: 400;
        src: url(https://fonts.gstatic.com/s/notosansjp/v53/-F62fjtqLzK2oHiWV4EQZPOBBnwHKAMEQbc.woff2) format('woff2');
      }
    `;

    const url = extractFontUrl(css);
    expect(url).toBe("https://fonts.gstatic.com/s/notosansjp/v53/-F62fjtqLzK2oHiWV4EQZPOBBnwHKAMEQbc.woff2");
  });

  it("extracts url when surrounded with quotes", () => {
    const css = `src: url('https://fonts.gstatic.com/example.woff2') format('woff2');`;
    expect(extractFontUrl(css)).toBe("https://fonts.gstatic.com/example.woff2");
  });

  it("throws descriptive error when no URL found", () => {
    expect(() => extractFontUrl("body { color: red; }")).toThrow(
      "No font binary URL found in CSS response",
    );
  });
});
