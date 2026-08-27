import { describe, expect, it } from "vitest";
import { arrayBufferToDataUri } from "./embedImage";

describe("arrayBufferToDataUri", () => {
  it("converts byte array into data URI with given mime type", () => {
    const bytes = new Uint8Array([137, 80, 78, 71]).buffer;
    const uri = arrayBufferToDataUri(bytes, "image/png");

    expect(uri.startsWith("data:image/png;base64,")).toBe(true);
    expect(uri).not.toContain("http://");
    expect(uri).not.toContain("https://");
    expect(uri).toBe("data:image/png;base64,iVBORw==");
  });
});
