import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PagePreview } from "./PagePreview";
import { calculatePageGeometry } from "../../domain/pagePreview/pageLayout";
import { DEFAULT_PAGE_LAYOUT } from "../../domain/pagePreview/defaults";
import { createSvgDocument } from "../../rendering/svg/document";
import type { FullYearPageDefinition } from "../../domain/pagePreview/fullYearPages";

describe("PagePreview", () => {
  const definition: FullYearPageDefinition = {
    pageIndex: 0,
    label: "2027-1",
    mainMonth: { year: 2027, month: 1 },
    previousMiniMonth: { year: 2026, month: 12 },
    nextMiniMonth: { year: 2027, month: 2 },
  };

  const geometry = calculatePageGeometry({
    layout: DEFAULT_PAGE_LAYOUT,
    mainSize: { width: 1000, height: 700 },
    miniSize: { width: 300, height: 200 },
  });

  const mainDoc = createSvgDocument(1000, 700, []);
  const prevMiniDoc = createSvgDocument(300, 200, []);
  const nextMiniDoc = createSvgDocument(300, 200, []);

  it("renders page label and responsive canvas with placements in percentage", () => {
    const { container } = render(
      <PagePreview
        definition={definition}
        geometry={geometry}
        mainDocument={mainDoc}
        previousMiniDocument={prevMiniDoc}
        nextMiniDocument={nextMiniDoc}
        backgroundDataUri="data:image/png;base64,AAAA"
      />,
    );

    expect(screen.getByText("2027-1")).toBeDefined();

    const bgImg = screen.getByAltText("页面背景图");
    expect(bgImg).toBeDefined();
    expect(bgImg.getAttribute("src")).toBe("data:image/png;base64,AAAA");

    const svgs = container.querySelectorAll("svg");
    // Main, Previous Mini, Next Mini = 3 SVGs
    expect(svgs.length).toBe(3);
  });

  it("ensures DOM layering order is background -> main -> previous mini -> next mini", () => {
    const { container } = render(
      <PagePreview
        definition={definition}
        geometry={geometry}
        mainDocument={mainDoc}
        previousMiniDocument={prevMiniDoc}
        nextMiniDocument={nextMiniDoc}
        backgroundDataUri="data:image/png;base64,AAAA"
      />,
    );

    const canvas = container.querySelector(".page-preview-canvas");
    expect(canvas).toBeDefined();

    const children = canvas!.children;
    expect(children[0].tagName.toLowerCase()).toBe("img"); // background
    expect(children[1].getAttribute("data-slot")).toBe("main");
    expect(children[2].getAttribute("data-slot")).toBe("previous-mini");
    expect(children[3].getAttribute("data-slot")).toBe("next-mini");
  });
});
