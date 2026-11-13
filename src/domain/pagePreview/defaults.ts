import type { PageLayout, PagePreviewConfig } from "./types";

export const DEFAULT_PAGE_LAYOUT: PageLayout = {
  width: 1400,
  height: 900,
  main: { width: 894, height: 639, position: { anchor: "top-right", offsetX: -40, offsetY: 40 } },
  previousMini: { width: 306, height: 230, position: { anchor: "top-left", offsetX: 40, offsetY: 40 } },
  nextMini: { width: 306, height: 230, position: { anchor: "top-left", offsetX: 40, offsetY: 294 } },
};
export const DEFAULT_PAGE_PREVIEW_CONFIG: PagePreviewConfig = { layout: DEFAULT_PAGE_LAYOUT };
