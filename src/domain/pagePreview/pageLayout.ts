import type { CalendarPlacement, PageGeometry, PageLayout, PageLayoutWarning, Placement } from "./types";

export function calculatePageGeometry(args: {
  layout: PageLayout;
  mainSize: Readonly<{ width: number; height: number }>;
  miniSize: Readonly<{ width: number; height: number }>;
}): PageGeometry {
  const { layout, mainSize, miniSize } = args;
  const page = { x: 0, y: 0, width: layout.width, height: layout.height };
  const warnings: PageLayoutWarning[] = [];
  const place = (calendar: CalendarPlacement, size: typeof mainSize, name: string): Placement => {
    const { width, height } = size;
    const { position } = calendar;
    const { anchor, offsetX, offsetY } = position;
    const horizontal = anchor.endsWith("-left") ? 0 : anchor.endsWith("-right") ? 1 : 0.5;
    const vertical = anchor.startsWith("top-") ? 0 : anchor.startsWith("bottom-") ? 1 : 0.5;
    const x = (page.width - width) * horizontal + offsetX;
    const y = (page.height - height) * vertical + offsetY;
    if (x < 0 || y < 0 || x + width > page.width || y + height > page.height) {
      warnings.push({ code: "calendar-overflow", message: `${name} extends beyond the page.` });
    }
    return { x, y, width, height };
  };
  return {
    page,
    main: place(layout.main, mainSize, "Main calendar"),
    previousMini: place(layout.previousMini, miniSize, "Previous month mini calendar"),
    nextMini: place(layout.nextMini, miniSize, "Next month mini calendar"),
    warnings,
  };
}
