import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { HolidayLayer } from "../../domain/template/holidayLayer";
import { layoutMain } from "../../rendering/layout/mainLayout";
import { layoutMini } from "../../rendering/layout/miniLayout";
import type { SvgDocument } from "../../rendering/svg/document";
import { materializeSvg } from "../../rendering/svg/materialize";
import type { AssetResolver } from "../../resources/assets/types";
import type { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";
import type {
  ExportMode,
  FormalExportCalendarSet,
  FormalRenderedDocuments,
} from "./types";

export async function renderFormalDocuments(args: {
  calendarSet: FormalExportCalendarSet;
  mainTemplate: MainTemplate;
  miniTemplate: MiniTemplate;
  holidayLayers?: readonly HolidayLayer[];
  mode: ExportMode;
  fontEngine: ResolvedFontEngine;
  assetResolver: AssetResolver;
}): Promise<FormalRenderedDocuments> {
  const {
    calendarSet,
    mainTemplate,
    miniTemplate,
    holidayLayers,
    mode,
    fontEngine,
    assetResolver,
  } = args;

  const main = new Map<string, SvgDocument>();
  const mini = new Map<string, SvgDocument>();

  // 1. Render exactly 13 Main documents
  for (const [key, calendar] of calendarSet.mainCalendars) {
    const scene = layoutMain({
      calendar,
      template: mainTemplate,
      holidayLayers,
      textMeasurer: fontEngine,
    });
    const doc = await materializeSvg({
      scene,
      mode,
      fontEngine,
      assetResolver,
    });
    main.set(key, doc);
  }

  // 2. Render exactly 15 Mini documents
  for (const [key, calendar] of calendarSet.miniCalendars) {
    const scene = layoutMini({
      calendar,
      template: miniTemplate,
      holidayLayers,
      textMeasurer: fontEngine,
    });
    const doc = await materializeSvg({
      scene,
      mode,
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
