export type Rect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type VerticalAlignment = "top" | "center" | "bottom";

export type PageLayout = Readonly<{
  width: number;
  height: number;
  padding: number;
  // Legacy ratios are used only when explicit dimensions are absent.
  leftColumnRatio: number;
  mainWidth?: number;
  mainHeight?: number;
  miniWidth?: number;
  miniHeight?: number;
  columnGap: number;
  miniHeightRatio: number;
  miniGap: number;
  mainVerticalAlignment?: VerticalAlignment;
  miniVerticalAlignment?: VerticalAlignment;
}>;

export type PagePreviewConfig = Readonly<{
  layout: PageLayout;
  backgroundAssetId?: string;
}>;

export type Placement = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}>;

export type PageLayoutWarning = Readonly<{
  code:
    | "invalid-content-area"
    | "calendar-width-overflow"
    | "main-height-overflow"
    | "mini-stack-overflow";
  message: string;
}>;

export type PageGeometry = Readonly<{
  page: Rect;
  content: Rect;
  leftColumn: Rect;
  main: Placement;
  previousMiniSlot: Rect;
  nextMiniSlot: Rect;
  previousMini: Placement;
  nextMini: Placement;
  warnings: readonly PageLayoutWarning[];
}>;
