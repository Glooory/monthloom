import { describe, expect, it } from "vitest";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import {
  base,
  fixtureLibrary,
} from "../../domain/holiday/testFixtures";
import { resolveHolidayIndex } from "../../domain/holiday/resolveHolidayIndex";
import { createDefaultHolidayLayers } from "../../domain/template/holidayLayer";
import {
  DEFAULT_MAIN_TEMPLATE,
  DEFAULT_MINI_TEMPLATE,
} from "../../domain/template/defaults";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import { layoutMain } from "./mainLayout";
import { layoutMini } from "./miniLayout";
import type { TextMeasurer } from "./textMetrics";

describe("Domain -> Layout Integration", () => {
  const fakeMeasurer: TextMeasurer = {
    measure: (text, typography) => ({
      width: text.length * (typography.fontSize * 0.6),
      ascent: typography.fontSize * 0.8,
      descent: -typography.fontSize * 0.2,
    }),
  };

  const layers = createDefaultHolidayLayers();
  const cnLayer = layers[0];
  const jpLayer = layers[1];

  const library = fixtureLibrary({
    baseRecords: [
      base(cnLayer.calendarId, "2027-04-30", "workday"),
      base(cnLayer.calendarId, "2027-05-01", "holiday", "劳动节"),
      base(cnLayer.calendarId, "2027-05-05", "holiday", "端午节"),
      base(cnLayer.calendarId, "2027-05-08", "workday"),
      base(cnLayer.calendarId, "2027-06-05", "holiday", "芒种"),
      base(jpLayer.calendarId, "2027-05-03", "holiday", "憲法記念日"),
      base(jpLayer.calendarId, "2027-05-04", "holiday", "みどりの日"),
      base(jpLayer.calendarId, "2027-05-05", "holiday", "こどもの日"),
    ],
  });

  const holidayIndex = resolveHolidayIndex({ library, layers });

  // 2027-05 has 6 calendar weeks (May 1 is Saturday -> row 1 has only 1 day, May 31 is Monday -> row 6)
  const calendar = generateCalendarMonth(2027, 5, holidayIndex);

  it("converts CalendarMonth + MainTemplate into a full semantic Main RenderScene", () => {
    expect(calendar.weekCount).toBe(6);

    const scene = layoutMain({
      calendar,
      template: { ...DEFAULT_MAIN_TEMPLATE, showAdjacentDays: true },
      holidayLayers: layers,
      textMeasurer: fakeMeasurer,
    });

    expect(scene.width).toBe(DEFAULT_MAIN_TEMPLATE.width);
    expect(scene.height).toBe(DEFAULT_MAIN_TEMPLATE.height);

    // 1. Weekday nodes
    const weekdays = scene.nodes.filter((n) => n.semanticId === "main.weekday");
    expect(weekdays).toHaveLength(7);

    // 2. Grid border nodes (1 rect + 6 vertical + 5 horizontal = 12)
    const gridNodes = scene.nodes.filter((n) => n.semanticId === "main.grid");
    expect(gridNodes).toHaveLength(12);

    // 3. Date nodes (42 total in a 6-week month)
    const dateNodes = scene.nodes.filter((n) => n.semanticId === "main.date");
    expect(dateNodes).toHaveLength(42);

    // 4. China holiday & workday markers
    const holidayMarkers = scene.nodes.filter(
      (n) => n.semanticId === `main.holiday.${cnLayer.id}.holidayMarker`,
    );
    // 05-01, 05-05, and adjacent 06-05
    expect(holidayMarkers.length).toBeGreaterThanOrEqual(3);

    const workdayMarkers = scene.nodes.filter(
      (n) => n.semanticId === `main.holiday.${cnLayer.id}.workdayMarker`,
    );
    // 05-08 and adjacent 04-30
    expect(workdayMarkers.length).toBeGreaterThanOrEqual(2);

    // 5. China holiday names & Japan holiday names
    const chinaHolidayNames = scene.nodes.filter(
      (n) => n.semanticId === `main.holiday.${cnLayer.id}.name`,
    );
    expect(chinaHolidayNames.length).toBeGreaterThanOrEqual(2);

    const japanHolidayNames = scene.nodes.filter(
      (n) => n.semanticId === `main.holiday.${jpLayer.id}.name`,
    );
    expect(japanHolidayNames).toHaveLength(3); // 05-03, 05-04, 05-05

    // 6. Coexistence on 2027-05-05: Japan date color overrides
    const may5DateNode = scene.nodes.find(
      (n) =>
        n.semanticId === "main.date" && n.kind === "text" && n.text === "5",
    );
    expect(may5DateNode).toBeDefined();
    if (may5DateNode && may5DateNode.kind === "text") {
      expect(may5DateNode.color).toBe(jpLayer.main.dateColors.holiday);
    }

    const may5ChinaName = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${cnLayer.id}.name` &&
        n.kind === "text" &&
        n.text === "端午节",
    );
    expect(may5ChinaName).toBeDefined();

    const may5JapanName = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${jpLayer.id}.name` &&
        n.kind === "text" &&
        n.text === "こどもの日",
    );
    expect(may5JapanName).toBeDefined();

    // 7. Adjacent month opacity applies to adjacent date content
    const apr30WorkdayMarker = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${cnLayer.id}.workdayMarker` &&
        n.kind === "text" &&
        n.cell.x === 500 && // Friday is column 5 -> x = 500
        n.cell.y === 50, // Row 0 -> y = 50
    );
    expect(apr30WorkdayMarker).toBeDefined();
    if (apr30WorkdayMarker && apr30WorkdayMarker.kind === "text") {
      expect(apr30WorkdayMarker.opacity).toBe(
        cnLayer.main.workdayMarker.marker.type === "text"
          ? cnLayer.main.workdayMarker.marker.typography.opacity *
              DEFAULT_MAIN_TEMPLATE.adjacentMonthOpacity
          : 0.4,
      );
    }
  });

  it("converts CalendarMonth + MiniTemplate into a full semantic Mini RenderScene", () => {
    const scene = layoutMini({
      calendar,
      template: DEFAULT_MINI_TEMPLATE,
      holidayLayers: layers,
      textMeasurer: fakeMeasurer,
    });

    expect(scene.width).toBe(DEFAULT_MINI_TEMPLATE.width);
    expect(scene.height).toBe(DEFAULT_MINI_TEMPLATE.height);

    // 1. Month Label
    const monthLabel = scene.nodes.find(
      (n) => n.semanticId === "mini.monthLabel",
    );
    expect(monthLabel).toBeDefined();
    if (monthLabel && monthLabel.kind === "text") {
      expect(monthLabel.text).toBe("2027-5");
    }

    // 2. Weekdays
    const weekdays = scene.nodes.filter((n) => n.semanticId === "mini.weekday");
    expect(weekdays).toHaveLength(7);

    // 3. Date nodes: ONLY 31 current-month days
    const dateNodes = scene.nodes.filter((n) => n.semanticId === "mini.date");
    expect(dateNodes).toHaveLength(31);

    // 4. No Japan holiday name nodes
    const holidayNames = scene.nodes.filter(
      (n) =>
        n.semanticId === `main.holiday.${jpLayer.id}.name` ||
        n.semanticId === `main.holiday.${cnLayer.id}.name`,
    );
    expect(holidayNames).toHaveLength(0);

    // 5. China markers: only for current month
    // 05-01 (holiday), 05-05 (holiday) -> 2 holiday markers
    // 05-08 (workday) -> 1 workday marker
    const holidayMarkers = scene.nodes.filter(
      (n) => n.semanticId === `mini.holiday.${cnLayer.id}.holidayMarker`,
    );
    expect(holidayMarkers).toHaveLength(2);

    const workdayMarkers = scene.nodes.filter(
      (n) => n.semanticId === `mini.holiday.${cnLayer.id}.workdayMarker`,
    );
    expect(workdayMarkers).toHaveLength(1);

    // 6. 2027-05-05 date color is Japan holiday color
    const may5DateNode = scene.nodes.find(
      (n) =>
        n.semanticId === "mini.date" && n.kind === "text" && n.text === "5",
    );
    expect(may5DateNode).toBeDefined();
    if (may5DateNode && may5DateNode.kind === "text") {
      expect(may5DateNode.color).toBe(jpLayer.mini.dateColors.holiday);
    }
  });

  it("applies template configuration changes uniformly across all cells without date-specific overrides", () => {
    const customTemplate: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      showAdjacentDays: true,
      date: {
        position: { anchor: "center", offsetX: 4, offsetY: -4 },
        typography: {
          ...DEFAULT_MAIN_TEMPLATE.date.typography,
          fontSize: 22,
        },
      },
    };

    const scene = layoutMain({
      calendar,
      template: customTemplate,
      holidayLayers: layers,
      textMeasurer: fakeMeasurer,
    });

    const dateNodes = scene.nodes.filter((n) => n.semanticId === "main.date");
    expect(dateNodes).toHaveLength(42);

    for (const node of dateNodes) {
      if (node.kind === "text") {
        expect(node.position.anchor).toBe("center");
        expect(node.position.offsetX).toBe(4);
        expect(node.position.offsetY).toBe(-4);
        expect(node.typography.fontSize).toBe(22);
      }
    }
  });
});
