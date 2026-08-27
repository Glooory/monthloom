import type { CalendarMonth } from "../../domain/calendar/types";
import type { SvgDocument } from "../../rendering/svg/document";

export type FormalExportCalendarSet = Readonly<{
  mainCalendars: ReadonlyMap<string, CalendarMonth>;
  miniCalendars: ReadonlyMap<string, CalendarMonth>;
}>;

export type FormalRenderedDocuments = Readonly<{
  main: ReadonlyMap<string, SvgDocument>;
  mini: ReadonlyMap<string, SvgDocument>;
}>;

export type ExportMode = "outlined" | "editable";
