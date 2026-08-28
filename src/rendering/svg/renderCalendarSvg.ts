import type { CalendarMonth } from "../../domain/calendar/types";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import type { MiniTemplate } from "../../domain/template/miniTemplate";
import type { HolidayLayer } from "../../domain/template/holidayLayer";
import type { AssetResolver } from "../../resources/assets/types";
import { resolveFontEngine } from "../../resources/fonts/resolveFonts";
import {
  collectMainFontText,
  collectMiniFontText,
} from "../../resources/fonts/textRequirements";
import type { FontCatalog } from "../../resources/fonts/types";
import { layoutMain } from "../layout/mainLayout";
import { layoutMini } from "../layout/miniLayout";
import type { SvgDocument } from "./document";
import { materializeSvg, type SvgTextMode } from "./materialize";

export async function renderMainSvgDocument(args: {
  calendar: CalendarMonth;
  template: MainTemplate;
  holidayLayers?: readonly HolidayLayer[];
  fontCatalog: FontCatalog;
  assetResolver: AssetResolver;
  mode: SvgTextMode;
  fetchImpl?: typeof fetch;
}): Promise<SvgDocument> {
  const { calendar, template, holidayLayers, fontCatalog, assetResolver, mode, fetchImpl } = args;

  const requirements = collectMainFontText({ calendar, template, holidayLayers });
  const fontEngine = await resolveFontEngine({
    catalog: fontCatalog,
    requirements,
    assetResolver,
    fetchImpl,
  });

  const scene = layoutMain({
    calendar,
    template,
    holidayLayers,
    textMeasurer: fontEngine,
  });

  return await materializeSvg({
    scene,
    mode,
    fontEngine,
    assetResolver,
  });
}

export async function renderMiniSvgDocument(args: {
  calendar: CalendarMonth;
  template: MiniTemplate;
  holidayLayers?: readonly HolidayLayer[];
  fontCatalog: FontCatalog;
  assetResolver: AssetResolver;
  mode: SvgTextMode;
  fetchImpl?: typeof fetch;
}): Promise<SvgDocument> {
  const { calendar, template, holidayLayers, fontCatalog, assetResolver, mode, fetchImpl } = args;

  const requirements = collectMiniFontText({ calendar, template, holidayLayers });
  const fontEngine = await resolveFontEngine({
    catalog: fontCatalog,
    requirements,
    assetResolver,
    fetchImpl,
  });

  const scene = layoutMini({
    calendar,
    template,
    holidayLayers,
    textMeasurer: fontEngine,
  });

  return await materializeSvg({
    scene,
    mode,
    fontEngine,
    assetResolver,
  });
}
