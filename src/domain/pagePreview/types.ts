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
