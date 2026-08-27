import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import { layoutMain } from "../../rendering/layout/mainLayout";
import { layoutMini } from "../../rendering/layout/miniLayout";
import type { SvgDocument } from "../../rendering/svg/document";
import { materializeSvg } from "../../rendering/svg/materialize";
import type { AssetResolver } from "../../resources/assets/types";
import type { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";
import type { CalendarKey, FullYearCalendarSet } from "./calendarSet";

export type FullYearPreviewDocuments = Readonly<{
  main: ReadonlyMap<CalendarKey, SvgDocument>;
  mini: ReadonlyMap<CalendarKey, SvgDocument>;
}>;

export async function renderFullYearPreviewDocuments(args: {
  calendarSet: FullYearCalendarSet;
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  fontEngine: ResolvedFontEngine;
  assetResolver: AssetResolver;
}): Promise<FullYearPreviewDocuments> {
  const { calendarSet, mainTemplate, miniTemplate, fontEngine, assetResolver } = args;

  const main = new Map<CalendarKey, SvgDocument>();
  const mini = new Map<CalendarKey, SvgDocument>();

  // Render 13 unique Main documents
  for (const [key, calendar] of calendarSet.mainCalendars) {
    const scene = layoutMain({
      calendar,
      template: mainTemplate,
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
      template: miniTemplate,
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
