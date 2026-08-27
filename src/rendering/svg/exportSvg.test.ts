import { describe, expect, it, vi } from "vitest";
import { createSvgDocument } from "./document";
import { createSvgBlob, downloadSvg } from "./exportSvg";

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("SVG Export", () => {
  it("creates Blob from SvgDocument without inspecting or requiring React DOM", async () => {
    const doc = createSvgDocument(300, 200, [
      {
        kind: "rect",
        x: 0,
        y: 0,
        width: 300,
        height: 200,
        fill: "#fff",
      },
    ]);

    const blob = createSvgBlob(doc);
    expect(blob.type).toBe("image/svg+xml;charset=utf-8");
    expect(blob.size).toBeGreaterThan(0);

    const text = await readBlobAsText(blob);
    expect(text).toContain('width="300"');
    expect(text).toContain('height="200"');
    expect(text).toContain('<rect x="0" y="0" width="300" height="200" fill="#fff" />');
  });

  it("triggers browser download using object URL and anchor element", () => {
    const doc = createSvgDocument(100, 100, []);

    const mockCreateObjectURL = vi.fn(() => "blob:http://localhost/test-uuid");
    const mockRevokeObjectURL = vi.fn();
    const mockClick = vi.fn();

    const mockAnchor = {
      href: "",
      download: "",
      click: mockClick,
    };

    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return mockAnchor as unknown as HTMLAnchorElement;
      }
      return document.createElement(tag);
    });

    downloadSvg({ document: doc, filename: "monthloom-test.svg" });

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockAnchor.download).toBe("monthloom-test.svg");
    expect(mockAnchor.href).toBe("blob:http://localhost/test-uuid");
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/test-uuid");

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
