import { describe, expect, it } from "vitest";
import type { FontDescriptor } from "./font";
import type {
  Anchor,
  DotTemplate,
  ImageMarkerTemplate,
  Position,
  TextMarkerTemplate,
  Typography,
} from "./primitives";

describe("Template Primitives", () => {
  it("constructs valid Position, Typography, Marker, and Dot descriptors", () => {
    const anchor: Anchor = "top-left";
    expect(anchor).toBe("top-left");

    const position = {
      anchor: "center",
      offsetX: 10,
      offsetY: -5,
    } satisfies Position;

    expect(position.anchor).toBe("center");
    expect(position.offsetX).toBe(10);
    expect(position.offsetY).toBe(-5);

    const typography = {
      fontId: "inter-bold",
      fontSize: 14,
      fontWeight: 700,
      fontStyle: "normal",
      letterSpacing: 0,
      color: "#111827",
      opacity: 1,
    } satisfies Typography;

    expect(typography.fontSize).toBe(14);
    expect(typography.color).toBe("#111827");

    const textMarker = {
      type: "text",
      value: "休",
      position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
      typography,
    } satisfies TextMarkerTemplate;

    expect(textMarker.type).toBe("text");
    expect(textMarker.value).toBe("休");

    const imageMarker = {
      type: "image",
      assetId: "custom-icon",
      position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
      width: 12,
      height: 12,
      opacity: 0.8,
    } satisfies ImageMarkerTemplate;

    expect(imageMarker.type).toBe("image");
    expect(imageMarker.assetId).toBe("custom-icon");

    const dot = {
      position: { anchor: "bottom-center", offsetX: 0, offsetY: -2 },
      size: 4,
      color: "#EF4444",
      opacity: 1,
    } satisfies DotTemplate;

    expect(dot.size).toBe(4);
  });

  it("constructs valid Google and Local Font descriptors", () => {
    const googleFont = {
      family: "Inter",
      weight: 400,
      style: "normal",
      source: {
        type: "google",
        family: "Inter",
      },
    } satisfies FontDescriptor;

    expect(googleFont.source.type).toBe("google");

    const localFont = {
      family: "CustomSans",
      weight: 600,
      style: "italic",
      source: {
        type: "local",
        assetId: "custom-sans-asset",
      },
    } satisfies FontDescriptor;

    expect(localFont.source.type).toBe("local");
  });
});
