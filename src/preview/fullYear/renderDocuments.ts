import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { HolidayLayer } from "../../domain/template/holidayLayer";
import { layoutMain } from "../../rendering/layout/mainLayout";
import { layoutMini } from "../../rendering/layout/miniLayout";
import type { SvgDocument } from "../../rendering/svg/document";
import { materializeSvg } from "../../rendering/svg/materialize";
import type { AssetResolver } from "../../resources/assets/types";
import type { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";
import type { CalendarKey, FullYearCalendarSet } from "./calendarSet";
import type { PageLayout } from "../../domain/pagePreview/types";

export type FullYearPreviewDocuments = Readonly<{
  main: ReadonlyMap<CalendarKey, SvgDocument>;
  previousMini: ReadonlyMap<CalendarKey, SvgDocument>;
  nextMini: ReadonlyMap<CalendarKey, SvgDocument>;
}>;

export async function renderFullYearPreviewDocuments(args: {
  calendarSet: FullYearCalendarSet;
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  pageLayout?: PageLayout;
  holidayLayers?: readonly HolidayLayer[];
  fontEngine: ResolvedFontEngine;
  assetResolver: AssetResolver;
}): Promise<FullYearPreviewDocuments> {
  const {
    calendarSet,
    mainTemplate,
    miniTemplate,
    holidayLayers,
    fontEngine,
    assetResolver,
    pageLayout,
  } = args;

  const previewMainTemplate = pageLayout ? { ...mainTemplate, width: pageLayout.main.width, height: pageLayout.main.height } : mainTemplate;
  const main = new Map<CalendarKey, SvgDocument>();
  const previousMini = new Map<CalendarKey, SvgDocument>();
  const nextMini = new Map<CalendarKey, SvgDocument>();

  // Render 13 unique Main documents
  for (const [key, calendar] of calendarSet.mainCalendars) {
    const scene = layoutMain({
      calendar,
      template: previewMainTemplate,
      holidayLayers,
      textMeasurer: fontEngine,
    });
    const doc = await materializeSvg({
      scene,
      mode: "outlined",
      fontEngine,
      assetResolver,
    });
    main.set(key, doc);
  }

  // Each Mini role has its own dimensions, even when the month is the same.
  for (const [role, documents] of [["previousMini", previousMini], ["nextMini", nextMini]] as const) {
    const template = pageLayout ? { ...miniTemplate, width: pageLayout[role].width, height: pageLayout[role].height } : miniTemplate;
    for (const [key, calendar] of calendarSet.miniCalendars) {
      const scene = layoutMini({ calendar, template, holidayLayers, textMeasurer: fontEngine });
      documents.set(key, await materializeSvg({ scene, mode: "outlined", fontEngine, assetResolver }));
    }
  }
  return { main, previousMini, nextMini };
}
