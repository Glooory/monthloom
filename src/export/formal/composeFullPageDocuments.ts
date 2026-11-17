import type { YearMonth } from "../../domain/calendar/types";
import { getFullYearPageDefinitions } from "../../domain/pagePreview/fullYearPages";
import { calculatePageGeometry } from "../../domain/pagePreview/pageLayout";
import type { PagePreviewConfig, Placement } from "../../domain/pagePreview/types";
import type { SvgNode } from "../../rendering/svg/ast";
import { createSvgDocument, type SvgDocument } from "../../rendering/svg/document";
import type { FormalRenderedDocuments } from "./types";

export async function composeFullPageDocuments(args: {
  targetYear: number;
  documents: FormalRenderedDocuments;
  pagePreview: PagePreviewConfig;
}): Promise<ReadonlyMap<string, SvgDocument>> {
  const { targetYear, documents, pagePreview } = args;
  const full = new Map<string, SvgDocument>();
  const requireDocument = (docs: ReadonlyMap<string, SvgDocument>, month: YearMonth) => {
    const key = `${month.year}-${month.month}`;
    const doc = docs.get(key);
    if (!doc) throw new Error(`Missing calendar document for full-page export: ${key}`);
    return doc;
  };
  const place = (doc: SvgDocument, placement: Placement): SvgNode => ({
    kind: "viewport",
    ...placement,
    viewBox: doc.viewBox,
    children: doc.children,
  });

  for (const definition of getFullYearPageDefinitions(targetYear)) {
    const main = requireDocument(documents.main, definition.mainMonth);
    const previousMini = requireDocument(documents.mini, definition.previousMiniMonth);
    const nextMini = requireDocument(documents.mini, definition.nextMiniMonth);
    const geometry = calculatePageGeometry({
      layout: pagePreview.layout,
      mainSize: main,
      miniSize: previousMini,
    });
    const { width, height } = geometry.page;
    const children: SvgNode[] = [
      place(main, geometry.main),
      place(previousMini, geometry.previousMini),
      place(nextMini, geometry.nextMini),
    ];
    full.set(definition.label, createSvgDocument(width, height, children));
  }
  return full;
}
