import React from "react";
import type { FullYearPageDefinition } from "../../domain/pagePreview/fullYearPages";
import type { PageGeometry, Placement } from "../../domain/pagePreview/types";
import type { SvgDocument } from "../../rendering/svg/document";
import { SvgPreview } from "../../rendering/svg/SvgPreview";
import "./full-year-preview.css";

export interface PagePreviewProps {
  definition: FullYearPageDefinition;
  geometry: PageGeometry;
  mainDocument: SvgDocument;
  previousMiniDocument: SvgDocument;
  nextMiniDocument: SvgDocument;
  backgroundDataUri: string | null;
}

function placementToStyle(placement: Placement, page: { width: number; height: number }): React.CSSProperties {
  const left = (placement.x / page.width) * 100;
  const top = (placement.y / page.height) * 100;
  const width = (placement.width / page.width) * 100;
  const height = (placement.height / page.height) * 100;

  return {
    position: "absolute",
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

export const PagePreview: React.FC<PagePreviewProps> = ({
  definition,
  geometry,
  mainDocument,
  previousMiniDocument,
  nextMiniDocument,
  backgroundDataUri,
}) => {
  const { page, main, previousMini, nextMini } = geometry;

  return (
    <div className="full-year-page-wrapper">
      <div className="full-year-page-label">{definition.label}</div>
      <div
        className="page-preview-canvas"
        style={{
          aspectRatio: `${page.width} / ${page.height}`,
        }}
      >
        {backgroundDataUri && (
          <img
            src={backgroundDataUri}
            alt="Page background"
            className="page-preview-bg"
          />
        )}

        <div
          className="page-preview-slot"
          data-slot="main"
          style={placementToStyle(main, page)}
        >
          <SvgPreview document={mainDocument} className="page-preview-svg" />
        </div>

        <div
          className="page-preview-slot"
          data-slot="previous-mini"
          style={placementToStyle(previousMini, page)}
        >
          <SvgPreview document={previousMiniDocument} className="page-preview-svg" />
        </div>

        <div
          className="page-preview-slot"
          data-slot="next-mini"
          style={placementToStyle(nextMini, page)}
        >
          <SvgPreview document={nextMiniDocument} className="page-preview-svg" />
        </div>
      </div>
    </div>
  );
};
