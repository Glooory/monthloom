import { describe, expect, it } from "vitest";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import {
  createDefaultHolidayLayers,
  type HolidayLayer,
} from "../../domain/template/holidayLayer";
import { DEFAULT_MAIN_TEMPLATE } from "../../domain/template/defaults";
import type { MainTemplate } from "../../domain/template/mainTemplate";
import { layoutMain } from "./mainLayout";
import type { TextMeasurer } from "./textMetrics";

describe("Main Layout", () => {
  const fakeMeasurer: TextMeasurer = {
    measure: (text, typography) => ({
      width: text.length * (typography.fontSize * 0.6),
      ascent: typography.fontSize * 0.8,
      descent: -typography.fontSize * 0.2,
    }),
  };

  it("produces correct scene dimensions and structure for 5-week month", () => {
    // 2027-02 has 5 weeks in standard Sunday-start calendar
    const calendar = generateCalendarMonth(2027, 2);
    expect(calendar.weekCount).toBe(5);

    const scene = layoutMain({
      calendar,
      template: DEFAULT_MAIN_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });

    expect(scene.width).toBe(DEFAULT_MAIN_TEMPLATE.width);
    expect(scene.height).toBe(DEFAULT_MAIN_TEMPLATE.height);

    // Weekdays
    const weekdays = scene.nodes.filter((n) => n.semanticId === "main.weekday");
    expect(weekdays).toHaveLength(7);
    expect(weekdays.map((w) => (w.kind === "text" ? w.text : ""))).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);

    // Grid border
    const gridNodes = scene.nodes.filter((n) => n.semanticId === "main.grid");
    // 1 outer rect + 6 vertical + 4 horizontal = 11
    expect(gridNodes).toHaveLength(11);

    // Date nodes (all 35 cells in a 5-week month)
    const dateNodes = scene.nodes.filter((n) => n.semanticId === "main.date");
    expect(dateNodes).toHaveLength(35);
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

  it("applies adjacent-month opacity to dates and holiday elements but not to grid or weekdays", () => {
    const layers = createDefaultHolidayLayers();
    const cnLayer = layers[0];
    const jpLayer = layers[1];

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
                name: "劳动节",
              },
            ],
          },
        ],
        [
          "2027-05-03",
          {
            occurrences: [
              {
                layerId: jpLayer.id,
                calendarId: jpLayer.calendarId,
                type: "holiday",
                name: "憲法記念日",
              },
            ],
          },
        ],
        [
          "2027-06-01",
          {
            occurrences: [
              {
                layerId: jpLayer.id,
                calendarId: jpLayer.calendarId,
                type: "holiday",
                name: "テスト祝日",
              },
            ],
          },
        ],
      ]),
    );

    const template: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      adjacentMonthOpacity: 0.5,
    };

    const scene = layoutMain({
      calendar,
      template,
      holidayLayers: layers,
      textMeasurer: fakeMeasurer,
    });

    // Weekday opacity remains unchanged
    const weekdays = scene.nodes.filter((n) => n.semanticId === "main.weekday");
    for (const w of weekdays) {
      if (w.kind === "text") {
        expect(w.opacity).toBe(template.weekdayRow.weekday.typography.opacity);
      }
    }

    // Check adjacent date node opacity
    const prevMonthDateNode = scene.nodes.find(
      (n) =>
        n.semanticId === "main.date" && n.kind === "text" && n.text === "25",
    );
    expect(prevMonthDateNode).toBeDefined();
    if (prevMonthDateNode && prevMonthDateNode.kind === "text") {
      expect(prevMonthDateNode.opacity).toBe(
        template.date.typography.opacity * 0.5,
      );
    }

    // Check current month date node opacity
    const currentMonthDateNode = scene.nodes.find(
      (n) =>
        n.semanticId === "main.date" && n.kind === "text" && n.text === "15",
    );
    expect(currentMonthDateNode).toBeDefined();
    if (currentMonthDateNode && currentMonthDateNode.kind === "text") {
      expect(currentMonthDateNode.opacity).toBe(
        template.date.typography.opacity * 1.0,
      );
    }

    // Check adjacent Japan holiday name opacity
    const adjacentJapanHoliday = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${jpLayer.id}.name` &&
        n.kind === "text" &&
        n.text === "テスト祝日",
    );
    expect(adjacentJapanHoliday).toBeDefined();
    if (adjacentJapanHoliday && adjacentJapanHoliday.kind === "text") {
      expect(adjacentJapanHoliday.opacity).toBe(
        jpLayer.main.name.typography.opacity * 0.5,
      );
    }

    // Check current Japan holiday name opacity
    const currentJapanHoliday = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${jpLayer.id}.name` &&
        n.kind === "text" &&
        n.text === "憲法記念日",
    );
    expect(currentJapanHoliday).toBeDefined();
    if (currentJapanHoliday && currentJapanHoliday.kind === "text") {
      expect(currentJapanHoliday.opacity).toBe(
        jpLayer.main.name.typography.opacity * 1.0,
      );
    }
  });

  it("renders China holiday marker, workday marker, and China holiday name with custom values", () => {
    const [defaultCnLayer] = createDefaultHolidayLayers();
    const cnLayer: HolidayLayer = {
      ...defaultCnLayer,
      main: {
        ...defaultCnLayer.main,
        holidayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "休假",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "font-zh",
              fontSize: 10,
              fontWeight: 400,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#DC2626",
              opacity: 1,
            },
          },
        },
        workdayMarker: {
          enabled: true,
          marker: {
            type: "text",
            value: "补班",
            position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
            typography: {
              fontId: "font-zh",
              fontSize: 10,
              fontWeight: 400,
              fontStyle: "normal",
              letterSpacing: 0,
              color: "#4B5563",
              opacity: 1,
            },
          },
        },
      },
    };

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
                name: "劳动节",
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

    const scene = layoutMain({
      calendar,
      template: DEFAULT_MAIN_TEMPLATE,
      holidayLayers: [cnLayer],
      textMeasurer: fakeMeasurer,
    });

    const holidayMarker = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${cnLayer.id}.holidayMarker` &&
        n.kind === "text",
    );
    expect(holidayMarker).toBeDefined();
    if (holidayMarker && holidayMarker.kind === "text") {
      expect(holidayMarker.text).toBe("休假");
    }

    const workdayMarker = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${cnLayer.id}.workdayMarker` &&
        n.kind === "text",
    );
    expect(workdayMarker).toBeDefined();
    if (workdayMarker && workdayMarker.kind === "text") {
      expect(workdayMarker.text).toBe("补班");
    }

    const chinaHolidayName = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${cnLayer.id}.name` &&
        n.kind === "text",
    );
    expect(chinaHolidayName).toBeDefined();
    if (chinaHolidayName && chinaHolidayName.kind === "text") {
      expect(chinaHolidayName.text).toBe("劳动节");
    }
  });

  it("renders both China and Japan holiday information when they coexist on the same date", () => {
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
            mainDateColor: jpLayer.main.dateColors.holiday,
          },
        ],
      ]),
    );

    const scene = layoutMain({
      calendar,
      template: DEFAULT_MAIN_TEMPLATE,
      holidayLayers: layers,
      textMeasurer: fakeMeasurer,
    });

    // Date color should be Japan holiday color
    const dateNode = scene.nodes.find(
      (n) =>
        n.semanticId === "main.date" && n.kind === "text" && n.text === "5",
    );
    expect(dateNode).toBeDefined();
    if (dateNode && dateNode.kind === "text") {
      expect(dateNode.color).toBe(jpLayer.main.dateColors.holiday);
    }

    // Both markers / names coexist
    const chinaMarker = scene.nodes.find(
      (n) => n.semanticId === `main.holiday.${cnLayer.id}.holidayMarker`,
    );
    const chinaName = scene.nodes.find(
      (n) => n.semanticId === `main.holiday.${cnLayer.id}.name`,
    );
    const japanName = scene.nodes.find(
      (n) => n.semanticId === `main.holiday.${jpLayer.id}.name`,
    );

    expect(chinaMarker).toBeDefined();
    expect(chinaName).toBeDefined();
    expect(japanName).toBeDefined();
  });

  it("handles image marker template correctly", () => {
    const layers = createDefaultHolidayLayers();
    const cnLayer = {
      ...layers[0],
      main: {
        ...layers[0].main,
        holidayMarker: {
          enabled: true,
          marker: {
            type: "image" as const,
            assetId: "holiday-badge",
            position: {
              anchor: "top-right" as const,
              offsetX: -2,
              offsetY: 2,
            },
            width: 16,
            height: 16,
            opacity: 0.9,
          },
        },
      },
    };

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
      ]),
    );

    const scene = layoutMain({
      calendar,
      template: DEFAULT_MAIN_TEMPLATE,
      holidayLayers: [cnLayer],
      textMeasurer: fakeMeasurer,
    });

    const imageNode = scene.nodes.find(
      (n) =>
        n.semanticId === `main.holiday.${cnLayer.id}.holidayMarker` &&
        n.kind === "image",
    );
    expect(imageNode).toBeDefined();
    if (imageNode && imageNode.kind === "image") {
      expect(imageNode.assetId).toBe("holiday-badge");
      expect(imageNode.width).toBe(16);
      expect(imageNode.height).toBe(16);
      expect(imageNode.opacity).toBe(0.9);
    }
  });

  it("adapts correctly across 4, 5, and 6 week calendars", () => {
    const months = [
      { year: 2026, month: 2, expectedWeeks: 4 },
      { year: 2027, month: 2, expectedWeeks: 5 },
      { year: 2027, month: 5, expectedWeeks: 6 },
    ];

    for (const { year, month, expectedWeeks } of months) {
      const calendar = generateCalendarMonth(year, month);
      expect(calendar.weekCount).toBe(expectedWeeks);

      const scene = layoutMain({
        calendar,
        template: DEFAULT_MAIN_TEMPLATE,
        textMeasurer: fakeMeasurer,
      });

      expect(scene.width).toBe(DEFAULT_MAIN_TEMPLATE.width);
      expect(scene.height).toBe(DEFAULT_MAIN_TEMPLATE.height);
      const dateNodes = scene.nodes.filter((n) => n.semanticId === "main.date");
      expect(dateNodes).toHaveLength(expectedWeeks * 7);
    }
  });

  it("renders custom weekday labels specified in template", () => {
    const calendar = generateCalendarMonth(2027, 1);
    const customTemplate: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      weekdayRow: {
        ...DEFAULT_MAIN_TEMPLATE.weekdayRow,
        labels: ["日", "一", "二", "三", "四", "五", "六"],
      },
    };

    const scene = layoutMain({
      calendar,
      template: customTemplate,
      textMeasurer: fakeMeasurer,
    });

    const weekdays = scene.nodes.filter((n) => n.semanticId === "main.weekday");
    expect(weekdays.map((w) => (w.kind === "text" ? w.text : ""))).toEqual([
      "日",
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
    ]);
  });

  it("handles startOfWeek: 1 (Monday start) mapping columns and colors correctly", () => {
    const calendar = generateCalendarMonth(2027, 1, undefined, 1);
    const template: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      weekdayRow: {
        ...DEFAULT_MAIN_TEMPLATE.weekdayRow,
        startOfWeek: 1,
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        colors: {
          default: "#333333",
          sunday: "#FF0000",
          saturday: "#0000FF",
        },
      },
    };

    const scene = layoutMain({
      calendar,
      template,
      textMeasurer: fakeMeasurer,
    });

    const weekdays = scene.nodes.filter((n) => n.semanticId === "main.weekday");
    // Column 0 is Mon, Col 5 is Sat, Col 6 is Sun
    expect(weekdays.map((w) => (w.kind === "text" ? w.text : ""))).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);

    // Check weekday colors
    if (weekdays[0].kind === "text") expect(weekdays[0].color).toBe("#333333"); // Mon
    if (weekdays[5].kind === "text") expect(weekdays[5].color).toBe("#0000FF"); // Sat
    if (weekdays[6].kind === "text") expect(weekdays[6].color).toBe("#FF0000"); // Sun
  });

  it("renders border lines for weekday row when showBorder is true", () => {
    const calendar = generateCalendarMonth(2027, 1);
    const template: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      weekdayRow: {
        ...DEFAULT_MAIN_TEMPLATE.weekdayRow,
        showBorder: true,
        borderWidth: 2,
        borderColor: "#999999",
      },
    };

    const scene = layoutMain({
      calendar,
      template,
      textMeasurer: fakeMeasurer,
    });

    const borderNodes = scene.nodes.filter(
      (n) =>
        n.semanticId === "main.grid" &&
        (n.kind === "rect" || n.kind === "line"),
    );
    // 12 date grid borders + 9 weekday row borders = 21 border nodes
    expect(borderNodes.length).toBe(21);

    const rectNodes = borderNodes.filter((n) => n.kind === "rect");
    expect(rectNodes).toHaveLength(1); // Only the date grid outer rect
  });
});
