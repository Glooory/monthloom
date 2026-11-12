import type {
  PageGeometry,
  PageLayout,
  PageLayoutWarning,
  Placement,
  Rect,
} from "./types";

export function calculatePageGeometry(args: {
  layout: PageLayout;
  mainSize: Readonly<{ width: number; height: number }>;
  miniSize: Readonly<{ width: number; height: number }>;
}): PageGeometry {
  const { layout, mainSize, miniSize } = args;
  const warnings: PageLayoutWarning[] = [];

  const page: Rect = {
    x: 0,
    y: 0,
    width: layout.width,
    height: layout.height,
  };

  const contentWidth = layout.width - 2 * layout.padding;
  const contentHeight = layout.height - 2 * layout.padding;

  const content: Rect = {
    x: layout.padding,
    y: layout.padding,
    width: Math.max(0, contentWidth),
    height: Math.max(0, contentHeight),
  };

  const leftColumnWidth = Math.max(0, layout.miniWidth ?? contentWidth * layout.leftColumnRatio);
  const leftColumn: Rect = {
    x: content.x,
    y: content.y,
    width: leftColumnWidth,
    height: content.height,
  };

  // Preserve sizing for saved layouts that predate explicit dimensions.
  const availableMainWidth = Math.max(
    0,
    contentWidth - leftColumnWidth - layout.columnGap,
  );

  if (
    contentWidth <= 0 ||
    contentHeight <= 0 ||
    (layout.mainWidth ?? availableMainWidth) <= 0 ||
    leftColumnWidth <= 0
  ) {
    warnings.push({
      code: "invalid-content-area",
      message: "Content dimensions or available space must be positive.",
    });
  }

  // Explicit dimensions override legacy width-derived sizing.
  const safeMainWidth = mainSize.width > 0 ? mainSize.width : 1;
  const renderedMainWidth = layout.mainWidth ?? availableMainWidth;
  const mainScale = renderedMainWidth / safeMainWidth;
  const renderedMainHeight = layout.mainHeight ?? mainSize.height * mainScale;

  const main: Placement = {
    x: layout.width - layout.padding - renderedMainWidth,
    y: content.y + Math.max(0, content.height - renderedMainHeight) *
      (layout.mainVerticalAlignment === "bottom" ? 1 : layout.mainVerticalAlignment === "center" ? 0.5 : 0),
    width: renderedMainWidth,
    height: renderedMainHeight,
    scale: mainScale,
  };

  if (renderedMainWidth + leftColumnWidth > content.width + 1e-6) {
    warnings.push({
      code: "calendar-width-overflow",
      message: "Calendar widths exceed available content width.",
    });
  }

  if (contentHeight > 0 && renderedMainHeight > contentHeight) {
    warnings.push({
      code: "main-height-overflow",
      message: `Rendered main calendar height (${renderedMainHeight.toFixed(1)}px) exceeds available content height (${contentHeight.toFixed(1)}px).`,
    });
  }

  // Mini slots
  const miniSlotWidth = leftColumnWidth;
  const miniSlotHeight = Math.max(0, layout.miniHeight ?? contentHeight * layout.miniHeightRatio);

  const previousMiniSlot: Rect = {
    x: content.x,
    y: content.y,
    width: miniSlotWidth,
    height: miniSlotHeight,
  };

  const nextMiniSlot: Rect = {
    x: content.x,
    y: content.y + miniSlotHeight + layout.miniGap,
    width: miniSlotWidth,
    height: miniSlotHeight,
  };

  if (
    contentHeight > 0 &&
    2 * miniSlotHeight + layout.miniGap > contentHeight
  ) {
    warnings.push({
      code: "mini-stack-overflow",
      message: `Combined mini calendar height (${(2 * miniSlotHeight + layout.miniGap).toFixed(1)}px) exceeds available content height (${contentHeight.toFixed(1)}px).`,
    });
  }

  // Legacy mini calendars retain contain scaling; explicit sizes fill the slot.
  const safeMiniWidth = miniSize.width > 0 ? miniSize.width : 1;
  const safeMiniHeight = miniSize.height > 0 ? miniSize.height : 1;

  const computeMiniPlacement = (slot: Rect): Placement => {
    if (slot.width <= 0 || slot.height <= 0) {
      return { x: slot.x, y: slot.y, width: 0, height: 0, scale: 0 };
    }
    const scale = Math.min(
      slot.width / safeMiniWidth,
      slot.height / safeMiniHeight,
    );
    const width = layout.miniWidth ?? miniSize.width * scale;
    const height = layout.miniHeight ?? miniSize.height * scale;
    const x = slot.x + (slot.width - width) / 2;
    const y = slot.y + (slot.height - height) / 2;
    return { x, y, width, height, scale: width / safeMiniWidth };
  };

  const previousMini = computeMiniPlacement(previousMiniSlot);
  const nextMini = computeMiniPlacement(nextMiniSlot);

  // Move the mini calendars as a pair, using their rendered bounds so even
  // width-constrained calendars meet the bottom padding exactly.
  const miniBottomSpace = Math.max(0, content.y + content.height - (nextMini.y + nextMini.height));
  const miniOffset = layout.miniVerticalAlignment === "bottom"
    ? miniBottomSpace
    : layout.miniVerticalAlignment === "center"
      ? Math.max(0, (miniBottomSpace - (previousMini.y - content.y)) / 2)
      : 0;

  return {
    page,
    content,
    leftColumn,
    main,
    previousMiniSlot: { ...previousMiniSlot, y: previousMiniSlot.y + miniOffset },
    nextMiniSlot: { ...nextMiniSlot, y: nextMiniSlot.y + miniOffset },
    previousMini: { ...previousMini, y: previousMini.y + miniOffset },
    nextMini: { ...nextMini, y: nextMini.y + miniOffset },
    warnings,
  };
}
