import type { Position } from "../template/primitives";

export type Rect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;
export type PageCalendar = "main" | "previousMini" | "nextMini";
export type CalendarPlacement = Readonly<{
  width: number;
  height: number;
  position: Position;
}>;
export type PageLayout = Readonly<{
  width: number;
  height: number;
  main: CalendarPlacement;
  previousMini: CalendarPlacement;
  nextMini: CalendarPlacement;
}>;
export type PagePreviewConfig = Readonly<{
  layout: PageLayout;
  backgroundAssetId?: string;
}>;
export type Placement = Rect;
export type PageLayoutWarning = Readonly<{
  code: "calendar-overflow";
  message: string;
}>;
export type PageGeometry = Readonly<{
  page: Rect;
  main: Placement;
  previousMini: Placement;
  nextMini: Placement;
  warnings: readonly PageLayoutWarning[];
}>;
