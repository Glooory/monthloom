import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MarkerInspector } from "./MarkerInspector";
import { createDefaultEditorDocument } from "../state/documentStore";
import type { BinaryAssetWriter } from "../../resources/assets/types";
import { memoryAssetStore } from "../assets/memoryAssetStore";

vi.mock("./TypographyInspector", () => ({ TypographyInspector: () => null }));
afterEach(cleanup);

function setup(image = false, writer?: BinaryAssetWriter) {
  const document = createDefaultEditorDocument();
  const layer = document.holidayLayers[0];
  const text = layer.main.holidayMarker.marker;
  const marker = image ? {
    type: "image" as const, assetId: "uploaded-image", position: text.position,
    width: 16, height: 16, opacity: 1,
  } : text;
  const onChangeMarker = vi.fn();
  render(<MarkerInspector marker={marker}
    defaultTextFontId={layer.main.name.typography.fontId}
    defaultTextFontDescriptor={document.fontCatalog[layer.main.name.typography.fontId]}
    fontAssetStore={writer}
    onChangeMarker={onChangeMarker} />);
  return { document, onChangeMarker };
}

describe("marker resource transitions", () => {
  it("does not commit an unresolved asset while waiting for an image upload", async () => {
    const { onChangeMarker } = setup();
    fireEvent.click(screen.getByRole("button", { name: "图片" }));
    for (const [marker] of onChangeMarker.mock.calls) {
      if (marker.type === "image") await memoryAssetStore.resolve(marker.assetId);
    }
    expect(onChangeMarker).not.toHaveBeenCalled();
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
  });

  it("saves uploaded bytes before committing the image reference", async () => {
    let finishSave!: () => void;
    const setAsset = vi.fn<BinaryAssetWriter["setAsset"]>(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    const { onChangeMarker } = setup(false, { setAsset });
    fireEvent.click(screen.getByRole("button", { name: "图片" }));
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [new File(["image-bytes"], "marker.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(setAsset).toHaveBeenCalledTimes(1));
    expect(onChangeMarker).not.toHaveBeenCalled();
    finishSave();
    await waitFor(() => expect(onChangeMarker).toHaveBeenCalledTimes(1));
    const marker = onChangeMarker.mock.calls[0][0];
    expect(marker.type).toBe("image");
    expect(marker.assetId).toBe(setAsset.mock.calls[0][0]);
    expect((await memoryAssetStore.resolve(marker.assetId)).mimeType).toBe("image/png");
  });

  it("keeps the current marker when saving an upload fails", async () => {
    const setAsset = vi.fn<BinaryAssetWriter["setAsset"]>().mockRejectedValue(new Error("Image save failed"));
    const { onChangeMarker } = setup(false, { setAsset });
    fireEvent.click(screen.getByRole("button", { name: "图片" }));
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [new File(["image-bytes"], "marker.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Image save failed"));
    expect(onChangeMarker).not.toHaveBeenCalled();
  });

  it("discards a pending image upload after switching back to text", async () => {
    let finishSave!: () => void;
    const setAsset = vi.fn<BinaryAssetWriter["setAsset"]>(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    const { onChangeMarker } = setup(false, { setAsset });
    fireEvent.click(screen.getByRole("button", { name: "图片" }));
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [new File(["image-bytes"], "marker.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(setAsset).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "文字" }));
    finishSave();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onChangeMarker).not.toHaveBeenCalled();
  });

  it("uses the registered font weight and style when switching to text", () => {
    const { document, onChangeMarker } = setup(true);
    fireEvent.click(screen.getByRole("button", { name: "文字" }));
    const marker = onChangeMarker.mock.calls[0][0];
    const descriptor = document.fontCatalog[marker.typography.fontId];
    expect(marker.typography.fontWeight).toBe(descriptor.weight);
    expect(marker.typography.fontStyle).toBe(descriptor.style);
  });
});
