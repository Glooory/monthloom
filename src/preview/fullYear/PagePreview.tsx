import React from "react";
import type { FullYearPageDefinition } from "../../domain/pagePreview/fullYearPages";
import type { PageGeometry, Placement } from "../../domain/pagePreview/types";
import type { SvgDocument } from "../../rendering/svg/document";
import { SvgPreview } from "../../rendering/svg/SvgPreview";
import "./full-year-preview.css";
import { useUiStore } from "../../editor/state/uiStore";
import { useI18n } from "../../shared/i18n/i18nStore";

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
  const selected = useUiStore((state) => state.pageSelection);
  const setSelected = useUiStore((state) => state.setPageSelection);
  const { t } = useI18n();

  return (
    <div className="full-year-page-wrapper">
      <div className="full-year-page-label">{definition.label}</div>
      <div
        className="page-preview-canvas"
        onClick={(event) => { event.stopPropagation(); setSelected(null); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setSelected(null);
            if (event.target instanceof HTMLElement) event.target.blur();
          }
        }}
        style={{
          aspectRatio: `${page.width} / ${page.height}`,
        }}
      >
        {backgroundDataUri && (
          <img
            src={backgroundDataUri}
            alt=""
            aria-hidden="true"
            className="page-preview-bg"
          />
        )}

        <div
          className={`page-preview-slot page-preview-selectable ${selected === "main" ? "is-selected" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={t.pagePreview.mainLabel}
          aria-pressed={selected === "main"}
          onClick={(event) => {
            event.stopPropagation();
            setSelected("main");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              setSelected("main");
            }
          }}
          data-slot="main"
          style={placementToStyle(main, page)}
        >
          <SvgPreview document={mainDocument} className="page-preview-svg" />
        </div>

        <div
          className={`page-preview-slot page-preview-selectable ${selected === "previousMini" ? "is-selected" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={t.pagePreview.previousMiniLabel}
          aria-pressed={selected === "previousMini"}
          onClick={(event) => {
            event.stopPropagation();
            setSelected("previousMini");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              setSelected("previousMini");
            }
          }}
          data-slot="previous-mini"
          style={placementToStyle(previousMini, page)}
        >
          <SvgPreview document={previousMiniDocument} className="page-preview-svg" />
        </div>

        <div
          className={`page-preview-slot page-preview-selectable ${selected === "nextMini" ? "is-selected" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={t.pagePreview.nextMiniLabel}
          aria-pressed={selected === "nextMini"}
          onClick={(event) => {
            event.stopPropagation();
            setSelected("nextMini");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              setSelected("nextMini");
            }
          }}
          data-slot="next-mini"
          style={placementToStyle(nextMini, page)}
        >
          <SvgPreview document={nextMiniDocument} className="page-preview-svg" />
        </div>
      </div>
    </div>
  );
};
