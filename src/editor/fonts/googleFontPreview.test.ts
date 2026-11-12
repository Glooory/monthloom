import { describe, expect, it } from "vitest";
import { ensureGoogleFontPreview, getGoogleFontPreviewFace } from "./googleFontPreview";

describe("Google font option previews", () => {
  it("requests a small stylesheet for a visible font only once", () => {
    expect(getGoogleFontPreviewFace("Merriweather")).toEqual({ weight: 400, style: "normal" });
    ensureGoogleFontPreview("Merriweather");
    ensureGoogleFontPreview("Merriweather");
    const links = [...document.querySelectorAll<HTMLLinkElement>("link[rel=stylesheet]")]
      .filter((link) => link.href.includes("family=Merriweather"));
    expect(links).toHaveLength(1);
    expect(links[0].href).toContain("text=Merriweather");
  });
});
