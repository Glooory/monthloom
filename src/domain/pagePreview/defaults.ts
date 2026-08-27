import type { PageLayout, PagePreviewConfig } from "./types";

export const DEFAULT_PAGE_LAYOUT: PageLayout = {
  width: 1400,
  height: 900,
  padding: 40,
  leftColumnRatio: 0.3,
  columnGap: 30,
  miniHeightRatio: 0.28,
  miniGap: 24,
} as const;

export const DEFAULT_PAGE_PREVIEW_CONFIG: PagePreviewConfig = {
  layout: DEFAULT_PAGE_LAYOUT,
} as const;
