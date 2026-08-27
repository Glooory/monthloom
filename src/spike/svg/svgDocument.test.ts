import { describe, expect, it } from "vitest";
import { createSvgDocument } from "./svgDocument";

describe("createSvgDocument", () => {
  it("uses configured dimensions as the document viewBox", () => {
    expect(createSvgDocument(700, 500, [])).toEqual({
      width: 700,
      height: 500,
      viewBox: "0 0 700 500",
      children: [],
    });
  });
});
