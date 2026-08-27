export type Rect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type PageLayout = Readonly<{
  width: number;
  height: number;
  padding: number;
  leftColumnRatio: number;
  columnGap: number;
  miniHeightRatio: number;
  miniGap: number;
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
