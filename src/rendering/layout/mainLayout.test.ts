import { describe, expect, it } from "vitest";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import type { TextMarkerTemplate } from "../../domain/template/primitives";
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
        width: firstDateNode.text.length * (firstDateNode.typography.fontSize * 0.6),
        ascent: firstDateNode.typography.fontSize * 0.8,
        descent: -firstDateNode.typography.fontSize * 0.2,
      });
    }
  });

  it("applies adjacent-month opacity to dates and holiday elements but not to grid or weekdays", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        ["2027-04-30", { china: { type: "workday" } }], // adjacent previous month
        ["2027-05-01", { china: { type: "holiday", name: "劳动节" } }], // current month
        ["2027-05-03", { japan: { name: "憲法記念日" } }], // current month
        ["2027-06-01", { japan: { name: "テスト祝日" } }], // adjacent next month
      ]),
    );

    const template: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      adjacentMonthOpacity: 0.5,
    };

    const scene = layoutMain({
      calendar,
      template,
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
      (n) => n.semanticId === "main.date" && n.kind === "text" && n.text === "25",
    );
    expect(prevMonthDateNode).toBeDefined();
    if (prevMonthDateNode && prevMonthDateNode.kind === "text") {
      expect(prevMonthDateNode.opacity).toBe(template.date.typography.opacity * 0.5);
    }

    // Check current month date node opacity
    const currentMonthDateNode = scene.nodes.find(
      (n) => n.semanticId === "main.date" && n.kind === "text" && n.text === "15",
    );
    expect(currentMonthDateNode).toBeDefined();
    if (currentMonthDateNode && currentMonthDateNode.kind === "text") {
      expect(currentMonthDateNode.opacity).toBe(template.date.typography.opacity * 1.0);
    }

    // Check adjacent Japan holiday name opacity
    const adjacentJapanHoliday = scene.nodes.find(
      (n) => n.semanticId === "main.japanHolidayName" && n.kind === "text" && n.text === "テスト祝日",
    );
    expect(adjacentJapanHoliday).toBeDefined();
    if (adjacentJapanHoliday && adjacentJapanHoliday.kind === "text") {
      expect(adjacentJapanHoliday.opacity).toBe(template.japanHolidayName.typography.opacity * 0.5);
    }

    // Check current Japan holiday name opacity
    const currentJapanHoliday = scene.nodes.find(
      (n) => n.semanticId === "main.japanHolidayName" && n.kind === "text" && n.text === "憲法記念日",
    );
    expect(currentJapanHoliday).toBeDefined();
    if (currentJapanHoliday && currentJapanHoliday.kind === "text") {
      expect(currentJapanHoliday.opacity).toBe(template.japanHolidayName.typography.opacity * 1.0);
    }
  });

  it("renders China holiday marker, workday marker, and China holiday name with custom values", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        ["2027-05-01", { china: { type: "holiday", name: "劳动节" } }],
        ["2027-05-08", { china: { type: "workday" } }],
      ]),
    );

    const defaultHolidayMarker = DEFAULT_MAIN_TEMPLATE.chinaMarkers.holiday as TextMarkerTemplate;
    const defaultWorkdayMarker = DEFAULT_MAIN_TEMPLATE.chinaMarkers.workday as TextMarkerTemplate;

    const customTemplate: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      chinaMarkers: {
        holiday: {
          type: "text",
          value: "休假",
          position: { anchor: "top-right", offsetX: -5, offsetY: 5 },
          typography: { ...defaultHolidayMarker.typography },
        },
        workday: {
          type: "text",
          value: "补班",
          position: { anchor: "top-right", offsetX: -5, offsetY: 5 },
          typography: { ...defaultWorkdayMarker.typography },
        },
      },
    };


    const scene = layoutMain({
      calendar,
      template: customTemplate,
      textMeasurer: fakeMeasurer,
    });

    const holidayMarker = scene.nodes.find(
      (n) => n.semanticId === "main.chinaHolidayMarker" && n.kind === "text",
    );
    expect(holidayMarker).toBeDefined();
    if (holidayMarker && holidayMarker.kind === "text") {
      expect(holidayMarker.text).toBe("休假");
    }

    const workdayMarker = scene.nodes.find(
      (n) => n.semanticId === "main.chinaWorkdayMarker" && n.kind === "text",
    );
    expect(workdayMarker).toBeDefined();
    if (workdayMarker && workdayMarker.kind === "text") {
      expect(workdayMarker.text).toBe("补班");
    }

    const chinaHolidayName = scene.nodes.find(
      (n) => n.semanticId === "main.chinaHolidayName" && n.kind === "text",
    );
    expect(chinaHolidayName).toBeDefined();
    if (chinaHolidayName && chinaHolidayName.kind === "text") {
      expect(chinaHolidayName.text).toBe("劳动节");
    }
  });

  it("renders both China and Japan holiday information when they coexist on the same date", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        [
          "2027-05-05",
          {
            china: { type: "holiday", name: "端午节" },
            japan: { name: "こどもの日" },
          },
        ],
      ]),
    );

    const scene = layoutMain({
      calendar,
      template: DEFAULT_MAIN_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });

    // Date color should be Japan holiday color
    const dateNode = scene.nodes.find(
      (n) => n.semanticId === "main.date" && n.kind === "text" && n.text === "5",
    );
    expect(dateNode).toBeDefined();
    if (dateNode && dateNode.kind === "text") {
      expect(dateNode.color).toBe(DEFAULT_MAIN_TEMPLATE.colors.japanHoliday);
    }

    // Both markers / names coexist
    const chinaMarker = scene.nodes.find((n) => n.semanticId === "main.chinaHolidayMarker");
    const chinaName = scene.nodes.find((n) => n.semanticId === "main.chinaHolidayName");
    const japanName = scene.nodes.find((n) => n.semanticId === "main.japanHolidayName");

    expect(chinaMarker).toBeDefined();
    expect(chinaName).toBeDefined();
    expect(japanName).toBeDefined();
  });

  it("handles image marker template correctly", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([["2027-05-01", { china: { type: "holiday" } }]]),
    );

    const imageTemplate: MainTemplate = {
      ...DEFAULT_MAIN_TEMPLATE,
      chinaMarkers: {
        holiday: {
          type: "image",
          assetId: "holiday-badge",
          position: { anchor: "top-right", offsetX: -2, offsetY: 2 },
          width: 16,
          height: 16,
          opacity: 0.9,
        },
        workday: DEFAULT_MAIN_TEMPLATE.chinaMarkers.workday,
      },
    };

    const scene = layoutMain({
      calendar,
      template: imageTemplate,
      textMeasurer: fakeMeasurer,
    });

    const imageNode = scene.nodes.find(
      (n) => n.semanticId === "main.chinaHolidayMarker" && n.kind === "image",
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
});

