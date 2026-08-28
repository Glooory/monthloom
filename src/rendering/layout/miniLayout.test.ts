import { describe, expect, it } from "vitest";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import { createDefaultHolidayLayers } from "../../domain/template/holidayLayer";
import { DEFAULT_MINI_TEMPLATE } from "../../domain/template/defaults";
import { layoutMini } from "./miniLayout";
import type { TextMeasurer } from "./textMetrics";

describe("Mini Layout", () => {
  const fakeMeasurer: TextMeasurer = {
    measure: (text, typography) => ({
      width: text.length * (typography.fontSize * 0.6),
      ascent: typography.fontSize * 0.8,
      descent: -typography.fontSize * 0.2,
    }),
  };

  it("produces correct scene dimensions and row structure for 5-week month", () => {
    const calendar = generateCalendarMonth(2027, 2);
    expect(calendar.weekCount).toBe(5);

    const scene = layoutMini({
      calendar,
      template: DEFAULT_MINI_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });

    expect(scene.width).toBe(DEFAULT_MINI_TEMPLATE.width);
    expect(scene.height).toBe(DEFAULT_MINI_TEMPLATE.height);

    // Month label
    const monthLabels = scene.nodes.filter(
      (n) => n.semanticId === "mini.monthLabel",
    );
    expect(monthLabels).toHaveLength(1);
    if (monthLabels[0]?.kind === "text") {
      expect(monthLabels[0].text).toBe("2027-2");
    }

    // Weekdays
    const weekdays = scene.nodes.filter((n) => n.semanticId === "mini.weekday");
    expect(weekdays).toHaveLength(7);
    expect(weekdays.map((w) => (w.kind === "text" ? w.text : ""))).toEqual([
      "S",
      "M",
      "T",
      "W",
      "T",
      "F",
      "S",
    ]);

    // No border lines or rects
    const lines = scene.nodes.filter(
      (n) => n.kind === "line" || n.kind === "rect",
    );
    expect(lines).toHaveLength(0);

    // Date nodes: ONLY current month dates in 2027-02 (28 days in non-leap year Feb)
    const dateNodes = scene.nodes.filter((n) => n.semanticId === "mini.date");
    expect(dateNodes).toHaveLength(28);
    const firstDateNode = dateNodes[0];
    expect(firstDateNode?.kind).toBe("text");
    if (firstDateNode && firstDateNode.kind === "text") {
      expect(typeof firstDateNode.originX).toBe("number");
      expect(typeof firstDateNode.baselineY).toBe("number");
      expect(firstDateNode.metrics).toEqual({
        width:
          firstDateNode.text.length * (firstDateNode.typography.fontSize * 0.6),
        ascent: firstDateNode.typography.fontSize * 0.8,
        descent: -firstDateNode.typography.fontSize * 0.2,
      });
    }
  });

  it("formats month label as YYYY-M without zero padding", () => {
    const calendarMay = generateCalendarMonth(2027, 5);
    const sceneMay = layoutMini({
      calendar: calendarMay,
      template: DEFAULT_MINI_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });
    const labelMay = sceneMay.nodes.find(
      (n) => n.semanticId === "mini.monthLabel",
    );
    expect(labelMay?.kind === "text" ? labelMay.text : "").toBe("2027-5");

    const calendarOct = generateCalendarMonth(2027, 10);
    const sceneOct = layoutMini({
      calendar: calendarOct,
      template: DEFAULT_MINI_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });
    const labelOct = sceneOct.nodes.find(
      (n) => n.semanticId === "mini.monthLabel",
    );
    expect(labelOct?.kind === "text" ? labelOct.text : "").toBe("2027-10");
  });

  it("does not render date nodes or markers for adjacent-month cells", () => {
    const layers = createDefaultHolidayLayers();
    const cnLayer = layers[0];

    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        [
          "2027-04-30",
          {
            occurrences: [
              {
                layerId: cnLayer.id,
                calendarId: cnLayer.calendarId,
                type: "workday",
              },
            ],
          },
        ],
        [
          "2027-05-01",
          {
            occurrences: [
              {
                layerId: cnLayer.id,
                calendarId: cnLayer.calendarId,
                type: "holiday",
              },
            ],
          },
        ],
        [
          "2027-06-01",
          {
            occurrences: [
              {
                layerId: cnLayer.id,
                calendarId: cnLayer.calendarId,
                type: "holiday",
              },
            ],
          },
        ],
      ]),
    );

    const scene = layoutMini({
      calendar,
      template: DEFAULT_MINI_TEMPLATE,
      holidayLayers: layers,
      textMeasurer: fakeMeasurer,
    });

    // 2027 May has 31 days
    const dateNodes = scene.nodes.filter((n) => n.semanticId === "mini.date");
    expect(dateNodes).toHaveLength(31);

    // Only 1 holiday marker for 2027-05-01
    const holidayMarkers = scene.nodes.filter(
      (n) => n.semanticId === `mini.holiday.${cnLayer.id}.holidayMarker`,
    );
    expect(holidayMarkers).toHaveLength(1);

    const workdayMarkers = scene.nodes.filter(
      (n) => n.semanticId === `mini.holiday.${cnLayer.id}.workdayMarker`,
    );
    expect(workdayMarkers).toHaveLength(0);
  });

  it("renders China holidayMarker and workdayMarker", () => {
    const layers = createDefaultHolidayLayers();
    const cnLayer = layers[0];

    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        [
          "2027-05-01",
          {
            occurrences: [
              {
                layerId: cnLayer.id,
                calendarId: cnLayer.calendarId,
                type: "holiday",
              },
            ],
          },
        ],
        [
          "2027-05-08",
          {
            occurrences: [
              {
                layerId: cnLayer.id,
                calendarId: cnLayer.calendarId,
                type: "workday",
              },
            ],
          },
        ],
      ]),
    );

    const scene = layoutMini({
      calendar,
      template: DEFAULT_MINI_TEMPLATE,
      holidayLayers: layers,
      textMeasurer: fakeMeasurer,
    });

    const holidayMarker = scene.nodes.find(
      (n) => n.semanticId === `mini.holiday.${cnLayer.id}.holidayMarker`,
    );
    expect(holidayMarker).toBeDefined();

    const workdayMarker = scene.nodes.find(
      (n) => n.semanticId === `mini.holiday.${cnLayer.id}.workdayMarker`,
    );
    expect(workdayMarker).toBeDefined();
  });

  it("changes date color for Japanese holiday but does not render holiday name", () => {
    const layers = createDefaultHolidayLayers();
    const cnLayer = layers[0];
    const jpLayer = layers[1];

    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        [
          "2027-05-05",
          {
            occurrences: [
              {
                layerId: cnLayer.id,
                calendarId: cnLayer.calendarId,
                type: "holiday",
                name: "端午节",
              },
              {
                layerId: jpLayer.id,
                calendarId: jpLayer.calendarId,
                type: "holiday",
                name: "こどもの日",
              },
            ],
            miniDateColor: jpLayer.mini.dateColors.holiday,
          },
        ],
      ]),
    );

    const scene = layoutMini({
      calendar,
      template: DEFAULT_MINI_TEMPLATE,
      holidayLayers: layers,
      textMeasurer: fakeMeasurer,
    });

    // Date color should be Japan holiday color
    const dateNode = scene.nodes.find(
      (n) =>
        n.semanticId === "mini.date" && n.kind === "text" && n.text === "5",
    );
    expect(dateNode).toBeDefined();
    if (dateNode && dateNode.kind === "text") {
      expect(dateNode.color).toBe(jpLayer.mini.dateColors.holiday);
    }

    // No text node with holiday name
    const holidayNameNode = scene.nodes.find(
      (n) =>
        n.kind === "text" && (n.text === "こどもの日" || n.text === "端午节"),
    );
    expect(holidayNameNode).toBeUndefined();

    // China holiday marker should still render
    const holidayMarker = scene.nodes.find(
      (n) => n.semanticId === `mini.holiday.${cnLayer.id}.holidayMarker`,
    );
    expect(holidayMarker).toBeDefined();
  });

  it("maintains fixed scene dimensions across 4, 5, and 6 week calendars", () => {
    const months = [
      { year: 2026, month: 2, expectedWeeks: 4 },
      { year: 2027, month: 2, expectedWeeks: 5 },
      { year: 2027, month: 5, expectedWeeks: 6 },
    ];

    for (const { year, month, expectedWeeks } of months) {
      const calendar = generateCalendarMonth(year, month);
      expect(calendar.weekCount).toBe(expectedWeeks);

      const scene = layoutMini({
        calendar,
        template: DEFAULT_MINI_TEMPLATE,
        textMeasurer: fakeMeasurer,
      });

      expect(scene.width).toBe(DEFAULT_MINI_TEMPLATE.width);
      expect(scene.height).toBe(DEFAULT_MINI_TEMPLATE.height);
    }
  });

  it("renders custom weekday labels specified in template", () => {
    const calendar = generateCalendarMonth(2027, 1);
    const customTemplate = {
      ...DEFAULT_MINI_TEMPLATE,
      weekdayRow: {
        ...DEFAULT_MINI_TEMPLATE.weekdayRow,
        labels: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
      },
    };

    const scene = layoutMini({
      calendar,
      template: customTemplate,
      textMeasurer: fakeMeasurer,
    });

    const weekdays = scene.nodes.filter((n) => n.semanticId === "mini.weekday");
    expect(weekdays.map((w) => (w.kind === "text" ? w.text : ""))).toEqual([
      "Su",
      "Mo",
      "Tu",
      "We",
      "Th",
      "Fr",
      "Sa",
    ]);
  });
});
