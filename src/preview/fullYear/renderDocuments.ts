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
import { calculatePageGeometry } from "../../domain/pagePreview/pageLayout";

export type FullYearPreviewDocuments = Readonly<{
  main: ReadonlyMap<CalendarKey, SvgDocument>;
  mini: ReadonlyMap<CalendarKey, SvgDocument>;
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

  const geometry = pageLayout && calculatePageGeometry({
    layout: pageLayout, mainSize: mainTemplate, miniSize: miniTemplate,
  });
  // Explicit preview sizes reflow a copy of the template. Legacy layouts keep
  // their original documents and uniform display scaling.
  const previewMainTemplate = geometry &&
    (pageLayout?.mainWidth !== undefined || pageLayout?.mainHeight !== undefined)
    ? { ...mainTemplate, width: geometry.main.width, height: geometry.main.height }
    : mainTemplate;
  const previewMiniTemplate = geometry &&
    (pageLayout?.miniWidth !== undefined || pageLayout?.miniHeight !== undefined)
    ? { ...miniTemplate, width: geometry.previousMini.width, height: geometry.previousMini.height }
    : miniTemplate;

  const main = new Map<CalendarKey, SvgDocument>();
  const mini = new Map<CalendarKey, SvgDocument>();

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

  // Render 15 unique Mini documents
  for (const [key, calendar] of calendarSet.miniCalendars) {
    const scene = layoutMini({
      calendar,
      template: previewMiniTemplate,
      holidayLayers,
      textMeasurer: fontEngine,
    });
    const doc = await materializeSvg({
      scene,
      mode: "outlined",
      fontEngine,
      assetResolver,
    });
    mini.set(key, doc);
  }

  return {
    main,
    mini,
  };
}
