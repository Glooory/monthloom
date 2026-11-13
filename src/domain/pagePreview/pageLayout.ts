import type { CalendarPlacement, PageGeometry, PageLayout, PageLayoutWarning, Placement } from "./types";

export function calculatePageGeometry(args: {
  layout: PageLayout;
}): PageGeometry {
  const { layout } = args;
  const page = { x: 0, y: 0, width: layout.width, height: layout.height };
  const warnings: PageLayoutWarning[] = [];
  const place = (calendar: CalendarPlacement, name: string): Placement => {
    const { width, height, position } = calendar;
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
  return { page, main: place(layout.main, "Main calendar"),
    previousMini: place(layout.previousMini, "Previous month mini calendar"),
    nextMini: place(layout.nextMini, "Next month mini calendar"), warnings };
}
