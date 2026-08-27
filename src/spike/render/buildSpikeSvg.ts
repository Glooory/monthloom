import type { SvgDocument, SvgNode } from "../svg/ast";
import { createSvgDocument } from "../svg/svgDocument";
import { buildGridGeometry } from "../geometry/gridGeometry";
import { layoutOutlinedText } from "../fonts/textLayout";
import type { SpikeFont } from "../fonts/fontkitAdapter";
import {
  SPIKE_VIEW_WIDTH,
  SPIKE_VIEW_HEIGHT,
  SPIKE_WEEKDAY_HEIGHT,
  WEEKDAYS,
  SAMPLE_TEXTS,
} from "../testData";

export type BuildSpikeSvgOptions = {
  strokeWidth: number;
  font: SpikeFont;
  markerDataUri?: string;
};

export function buildSpikeSvg(options: BuildSpikeSvgOptions): SvgDocument {
  const { strokeWidth, font, markerDataUri } = options;
  const nodes: SvgNode[] = [];

  const colWidth = SPIKE_VIEW_WIDTH / 7;
  const gridY = SPIKE_WEEKDAY_HEIGHT;
  const gridHeight = SPIKE_VIEW_HEIGHT - SPIKE_WEEKDAY_HEIGHT;
  const rowHeight = gridHeight / 5;

  // 1. Weekday headers (outlined text centered per column)
  WEEKDAYS.forEach((day, index) => {
    let color = "#333333";
    if (index === 0) color = "#dc2626"; // Sunday red
    if (index === 6) color = "#2563eb"; // Saturday blue

    const run = layoutOutlinedText({
      text: day,
      font,
      fontSize: 16,
      cell: {
        x: index * colWidth,
        y: 0,
        width: colWidth,
        height: SPIKE_WEEKDAY_HEIGHT,
      },
      position: {
        anchor: "center",
        offsetX: 0,
        offsetY: 0,
      },
      color,
    });

    nodes.push(...run.paths);
  });

  // 2. Date grid lines and border
  const gridNodes = buildGridGeometry({
    x: 0,
    y: gridY,
    width: SPIKE_VIEW_WIDTH,
    height: gridHeight,
    columns: 7,
    rows: 5,
    strokeWidth,
    strokeColor: "#4b5563",
  });
  nodes.push(...gridNodes);

  // Helper for cell bounds
  const getCell = (row: number, col: number) => ({
    x: col * colWidth,
    y: gridY + row * rowHeight,
    width: colWidth,
    height: rowHeight,
  });

  // 3. Numeric samples
  // "1" in Cell (row 0, col 0)
  const num1Run = layoutOutlinedText({
    text: SAMPLE_TEXTS.singleDigit,
    font,
    fontSize: 22,
    cell: getCell(0, 0),
    position: {
      anchor: "top-left",
      offsetX: 10,
      offsetY: 8,
    },
    color: "#dc2626", // Sunday
  });
  nodes.push(...num1Run.paths);

  // "31" in Cell (row 4, col 3)
  const num31Run = layoutOutlinedText({
    text: SAMPLE_TEXTS.doubleDigit,
    font,
    fontSize: 22,
    cell: getCell(4, 3),
    position: {
      anchor: "top-left",
      offsetX: 10,
      offsetY: 8,
    },
    color: "#111827",
  });
  nodes.push(...num31Run.paths);

  // 4. CJK samples
  // "春节" in Cell (row 1, col 2) - centered
  const cjkSpringRun = layoutOutlinedText({
    text: SAMPLE_TEXTS.chinese,
    font,
    fontSize: 15,
    cell: getCell(1, 2),
    position: {
      anchor: "center",
      offsetX: 0,
      offsetY: 0,
    },
    color: "#15803d",
  });
  nodes.push(...cjkSpringRun.paths);

  // "憲法記念日" in Cell (row 2, col 4) - bottom-right
  const cjkKenpouRun = layoutOutlinedText({
    text: SAMPLE_TEXTS.japanese,
    font,
    fontSize: 12,
    cell: getCell(2, 4),
    position: {
      anchor: "bottom-right",
      offsetX: -8,
      offsetY: -8,
    },
    color: "#dc2626",
  });
  nodes.push(...cjkKenpouRun.paths);

  // "文化の日" in Cell (row 3, col 1) - top-left with offset
  const cjkBunkaRun = layoutOutlinedText({
    text: SAMPLE_TEXTS.japaneseShort,
    font,
    fontSize: 12,
    cell: getCell(3, 1),
    position: {
      anchor: "top-left",
      offsetX: 10,
      offsetY: 38,
    },
    color: "#dc2626",
  });
  nodes.push(...cjkBunkaRun.paths);

  // 5. Text Marker "假" in Cell (row 1, col 2) - top-right
  const textMarkerRun = layoutOutlinedText({
    text: SAMPLE_TEXTS.marker,
    font,
    fontSize: 11,
    cell: getCell(1, 2),
    position: {
      anchor: "top-right",
      offsetX: -8,
      offsetY: 8,
    },
    color: "#dc2626",
  });
  nodes.push(...textMarkerRun.paths);

  // 6. Image Marker in Cell (row 0, col 6)
  if (markerDataUri) {
    const cell06 = getCell(0, 6);
    nodes.push({
      kind: "image",
      x: cell06.x + cell06.width - 26,
      y: cell06.y + 6,
      width: 20,
      height: 20,
      href: markerDataUri,
    });
  }

  return createSvgDocument(SPIKE_VIEW_WIDTH, SPIKE_VIEW_HEIGHT, nodes);
}
