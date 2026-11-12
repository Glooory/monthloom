import { describe, expect, it, vi } from "vitest";
import * as fontkit from "fontkit";
import { parseFontkitFace } from "./fontkitEngine";

vi.mock("fontkit", () => ({ create: vi.fn() }));

describe("font collection selection", () => {
  it("passes the selected PostScript name to fontkit for a TTC", () => {
    const font = { unitsPerEm: 1000, ascent: 800, descent: -200 };
    vi.mocked(fontkit.create).mockReturnValue(font as ReturnType<typeof fontkit.create>);
    const bytes = new Uint8Array([0x74, 0x74, 0x63, 0x66]).buffer;
    const face = parseFontkitFace({
      fontId: "date",
      bytes,
      descriptor: {
        family: "Menlo",
        weight: 700,
        style: "normal",
        source: { type: "local", assetId: "font-1", postscriptName: "Menlo-Bold" },
      },
    });

    expect(fontkit.create).toHaveBeenCalledWith(expect.any(Uint8Array), "Menlo-Bold");
    expect(face.internalFont).toBe(font);
  });

  it("reports a missing face in a collection", () => {
    vi.mocked(fontkit.create).mockReturnValue(null as unknown as ReturnType<typeof fontkit.create>);
    expect(() => parseFontkitFace({
      fontId: "date",
      bytes: new Uint8Array([0x74, 0x74, 0x63, 0x66]).buffer,
      descriptor: {
        family: "Menlo",
        weight: 700,
        style: "normal",
        source: { type: "local", assetId: "font-1", postscriptName: "Missing-Face" },
      },
    })).toThrow(/Missing-Face/);
  });
});
