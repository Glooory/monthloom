import { describe, it, expect } from "vitest";
import { resolvePublicAssetUrl } from "./assetUrl";

describe("resolvePublicAssetUrl", () => {
  it("resolves paths relative to root base", () => {
    expect(resolvePublicAssetUrl("vite.svg", "/")).toBe("/vite.svg");
    expect(resolvePublicAssetUrl("/vite.svg", "/")).toBe("/vite.svg");
  });

  it("resolves paths relative to repo subpath base", () => {
    expect(resolvePublicAssetUrl("vite.svg", "/monthloom/")).toBe("/monthloom/vite.svg");
    expect(resolvePublicAssetUrl("/vite.svg", "/monthloom/")).toBe("/monthloom/vite.svg");
    expect(resolvePublicAssetUrl("assets/icon.png", "/monthloom")).toBe("/monthloom/assets/icon.png");
  });
});
