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

export type FullYearPreviewDocuments = Readonly<{
  main: ReadonlyMap<CalendarKey, SvgDocument>;
  previousMini: ReadonlyMap<CalendarKey, SvgDocument>;
  nextMini: ReadonlyMap<CalendarKey, SvgDocument>;
}>;

export async function renderFullYearPreviewDocuments(args: {
  calendarSet: FullYearCalendarSet;
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
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
  } = args;

  const main = new Map<CalendarKey, SvgDocument>();
  const mini = new Map<CalendarKey, SvgDocument>();

  // Render 13 unique Main documents
  for (const [key, calendar] of calendarSet.mainCalendars) {
    const scene = layoutMain({
      calendar,
      template: mainTemplate,
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

  // Both Mini placements use the same template and rendered documents.
  for (const [key, calendar] of calendarSet.miniCalendars) {
    const scene = layoutMini({ calendar, template: miniTemplate, holidayLayers, textMeasurer: fontEngine });
    mini.set(key, await materializeSvg({ scene, mode: "outlined", fontEngine, assetResolver }));
  }
  return { main, previousMini: mini, nextMini: mini };
}
