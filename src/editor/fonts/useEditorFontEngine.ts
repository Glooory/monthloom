import { useMemo } from "react";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { EditorDocument } from "../model/types";
import type { BinaryAssetResolver } from "../../resources/assets/types";
import {
  collectMainFontText,
  collectMiniFontText,
  mergeFontTextRequirements,
} from "../../resources/fonts/textRequirements";
import { fontRequirementsKey } from "../../resources/fonts/resolveFonts";
import { usePreviewFonts } from "../../resources/fonts/usePreviewFonts";
import { createFormalExportCalendarSet } from "../../export/formal/monthSet";
import { resolveHolidayIndex } from "../../domain/holiday/resolveHolidayIndex";
import { useHolidayLibraryStore } from "../../workspace/state/holidayLibraryStore";

export type EditorFontEngineState = ReturnType<typeof usePreviewFonts>;

export function computeFontRequirementKey(args: {
  calendar: CalendarMonth;
  document: EditorDocument;
  activeTemplate?: "main" | "mini";
  weekdays?: readonly string[];
}) {
  const { calendar, document, activeTemplate, weekdays } = args;
  const main = collectMainFontText({
    calendar,
    template: document.mainTemplate,
    holidayLayers: document.holidayLayers,
    weekdays,
  });
  const mini = collectMiniFontText({
    calendar,
    template: document.miniTemplate,
    holidayLayers: document.holidayLayers,
    weekdays,
  });
  const requirements = mergeFontTextRequirements(
    activeTemplate === "main"
      ? [main]
      : activeTemplate === "mini"
        ? [mini]
        : [main, mini],
  );
  return {
    key: fontRequirementsKey(document.fontCatalog, requirements),
    requirements,
  };
}

export function useEditorFontEngine(args: {
  calendar: CalendarMonth;
  document: EditorDocument;
  activeTemplate?: "main" | "mini";
  targetYear?: number;
  weekdays?: readonly string[];
  assetResolver: BinaryAssetResolver;
  fetchImpl?: typeof fetch;
}): EditorFontEngineState {
  const library = useHolidayLibraryStore((state) => state.snapshot);
  const requirements = useMemo(() => {
    const { document, calendar, activeTemplate } = args;
    const holidayIndex = resolveHolidayIndex({
      library,
      layers: document.holidayLayers,
    });
    const set = createFormalExportCalendarSet({
      targetYear: args.targetYear ?? calendar.year,
      holidayIndex,
      mainStartOfWeek: document.mainTemplate.weekdayRow.startOfWeek,
      miniStartOfWeek: document.miniTemplate.weekdayRow.startOfWeek,
    });
    const entries = [computeFontRequirementKey(args).requirements];
    if (activeTemplate !== "mini")
      for (const month of set.mainCalendars.values()) {
        entries.push(
          collectMainFontText({
            calendar: month,
            template: document.mainTemplate,
            holidayLayers: document.holidayLayers,
            weekdays: args.weekdays,
          }),
        );
      }
    if (activeTemplate !== "main")
      for (const month of set.miniCalendars.values()) {
        entries.push(
          collectMiniFontText({
            calendar: month,
            template: document.miniTemplate,
            holidayLayers: document.holidayLayers,
            weekdays: args.weekdays,
          }),
        );
      }
    return mergeFontTextRequirements(entries);
  }, [
    args.calendar,
    args.document,
    args.activeTemplate,
    args.targetYear,
    args.weekdays,
    library,
  ]);
  return usePreviewFonts({
    ...args,
    catalog: args.document.fontCatalog,
    requirements,
  });
}
