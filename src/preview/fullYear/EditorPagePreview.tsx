import { useMemo, useRef } from "react";
import type { YearMonth } from "../../domain/calendar/types";
import type { HolidayIndex } from "../../domain/holiday/types";
import { calculatePageGeometry } from "../../domain/pagePreview/pageLayout";
import { useDocumentStore } from "../../editor/state/documentStore";
import type { AssetResolver } from "../../resources/assets/types";
import { usePreviewFonts } from "../../resources/fonts/usePreviewFonts";
import { usePreviewResource } from "../../shared/react/usePreviewResource";
import { PreviewStatusBanner } from "../../shared/react/PreviewStatusBanner";
import { useI18n } from "../../shared/i18n/i18nStore";
import { createFullYearCalendarSet, type CalendarKey } from "./calendarSet";
import { collectFullYearPreviewFontRequirements } from "./fontRequirements";
import { renderFullYearPreviewDocuments } from "./renderDocuments";
import { PagePreview } from "./PagePreview";

export function EditorPagePreview({ targetYear, month, holidayIndex, assetResolver }: {
  targetYear: number;
  month: YearMonth;
  holidayIndex?: HolidayIndex;
  assetResolver: AssetResolver;
}) {
  const { t } = useI18n();
  // Follow committed edits; pointer movement stays local to the editing canvas.
  const document = useDocumentStore((state) => state.document);
  const miniEnabled = document.pagePreview.layout.miniEnabled;
  const mainStartOfWeek = document.mainTemplate.weekdayRow.startOfWeek ?? 0;
  const miniStartOfWeek = document.miniTemplate.weekdayRow.startOfWeek ?? 0;
  const calendarSet = useMemo(() => {
    const all = createFullYearCalendarSet({ targetYear, holidayIndex, mainStartOfWeek, miniStartOfWeek, includeMini: miniEnabled });
    const matches = (candidate: YearMonth) => candidate.year === month.year && candidate.month === month.month;
    // Boundary Mini months belong to the first or last complete page.
    const page = all.pages.find((page) => matches(page.mainMonth))
      ?? all.pages.find((page) => matches(page.previousMiniMonth) || matches(page.nextMiniMonth));
    if (!page) throw new Error(`No preview page for ${month.year}-${month.month}`);
    const key = (value: YearMonth): CalendarKey => `${value.year}-${value.month}`;
    const miniKeys = new Set([key(page.previousMiniMonth), key(page.nextMiniMonth)]);
    return {
      pages: [page],
      mainCalendars: new Map([...all.mainCalendars].filter(([value]) => value === key(page.mainMonth))),
      miniCalendars: new Map([...all.miniCalendars].filter(([value]) => miniKeys.has(value))),
    };
  }, [targetYear, month.year, month.month, holidayIndex, mainStartOfWeek, miniStartOfWeek, miniEnabled]);
  const requirements = useMemo(() => collectFullYearPreviewFontRequirements({
    calendarSet, mainTemplate: document.mainTemplate, miniTemplate: document.miniTemplate,
    holidayLayers: document.holidayLayers,
  }), [calendarSet, document.mainTemplate, document.miniTemplate, document.holidayLayers]);
  const fonts = usePreviewFonts({ catalog: document.fontCatalog, requirements, assetResolver });
  const renderKey = useMemo(() => ({
    calendarSet, mainTemplate: document.mainTemplate, miniTemplate: document.miniTemplate,
    holidayLayers: document.holidayLayers, pageLayout: document.pagePreview.layout,
    fontEngine: fonts.fontEngine, assetResolver,
  }), [calendarSet, document.mainTemplate, document.miniTemplate, document.holidayLayers,
    document.pagePreview.layout, fonts.fontEngine, assetResolver]);
  const preview = usePreviewResource({ resourceKey: renderKey, load: async () => {
    if (!renderKey.fontEngine) return null;
    const documents = await renderFullYearPreviewDocuments({ ...renderKey, fontEngine: renderKey.fontEngine });
    const definition = calendarSet.pages[0];
    const mainDocument = documents.main.get(`${definition.mainMonth.year}-${definition.mainMonth.month}`);
    const previousMiniDocument = documents.previousMini.get(`${definition.previousMiniMonth.year}-${definition.previousMiniMonth.month}`);
    const nextMiniDocument = documents.nextMini.get(`${definition.nextMiniMonth.year}-${definition.nextMiniMonth.month}`);
    if (!mainDocument || (miniEnabled && (!previousMiniDocument || !nextMiniDocument))) throw new Error(`Incomplete preview page: ${definition.label}`);
    return {
      definition, mainDocument, previousMiniDocument, nextMiniDocument,
      geometry: calculatePageGeometry({ layout: renderKey.pageLayout, mainSize: renderKey.mainTemplate, miniSize: renderKey.miniTemplate }),
    };
  } });
  const loading = fonts.loading || preview.loading;
  const error = fonts.error ?? preview.error;
  const lastPreview = useRef<NonNullable<typeof preview.value> | null>(null);
  if (preview.value) lastPreview.current = preview.value;
  // Keep a complete page during font loading, but never show a different month.
  const displayed = lastPreview.current?.definition === calendarSet.pages[0] ? lastPreview.current : null;
  return (
    <>
      <PreviewStatusBanner error={error} issues={fonts.issues} loading={loading} retained={!!displayed}
        retry={() => { fonts.retry(); preview.retry(); }} />
      {displayed && <PagePreview {...displayed} assetResolver={assetResolver} />}
      {!displayed && !error && <div role="status">{t.gallery.loadingText}</div>}
    </>
  );
}
