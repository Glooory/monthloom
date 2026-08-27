import { describe, expect, it } from "vitest";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
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
    const monthLabels = scene.nodes.filter((n) => n.semanticId === "mini.monthLabel");
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
    const lines = scene.nodes.filter((n) => n.kind === "line" || n.kind === "rect");
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
        width: firstDateNode.text.length * (firstDateNode.typography.fontSize * 0.6),
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
    const labelMay = sceneMay.nodes.find((n) => n.semanticId === "mini.monthLabel");
    expect(labelMay?.kind === "text" ? labelMay.text : "").toBe("2027-5");

    const calendarOct = generateCalendarMonth(2027, 10);
    const sceneOct = layoutMini({
      calendar: calendarOct,
      template: DEFAULT_MINI_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });
    const labelOct = sceneOct.nodes.find((n) => n.semanticId === "mini.monthLabel");
    expect(labelOct?.kind === "text" ? labelOct.text : "").toBe("2027-10");
  });

  it("does not render date nodes or dots for adjacent-month cells", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        ["2027-04-30", { china: { type: "workday" } }], // adjacent previous
        ["2027-05-01", { china: { type: "holiday" } }], // current
        ["2027-06-01", { china: { type: "holiday" } }], // adjacent next
      ]),
    );

    const scene = layoutMini({
      calendar,
      template: DEFAULT_MINI_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });

    // 2027 May has 31 days
    const dateNodes = scene.nodes.filter((n) => n.semanticId === "mini.date");
    expect(dateNodes).toHaveLength(31);

    // Only 1 holiday dot for 2027-05-01 (adjacent 04-30 workday and 06-01 holiday must not render)
    const holidayDots = scene.nodes.filter((n) => n.semanticId === "mini.holidayDot");
    expect(holidayDots).toHaveLength(1);

    const workdayDots = scene.nodes.filter((n) => n.semanticId === "mini.workdayDot");
    expect(workdayDots).toHaveLength(0);
  });

  it("renders China holidayDot and workdayDot with radius = size / 2", () => {
    const calendar = generateCalendarMonth(
      2027,
      5,
      new Map([
        ["2027-05-01", { china: { type: "holiday" } }],
        ["2027-05-08", { china: { type: "workday" } }],
      ]),
    );

    const scene = layoutMini({
      calendar,
      template: DEFAULT_MINI_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });

    const holidayDot = scene.nodes.find((n) => n.semanticId === "mini.holidayDot");
    expect(holidayDot).toBeDefined();
    if (holidayDot && holidayDot.kind === "dot") {
      expect(holidayDot.radius).toBe(DEFAULT_MINI_TEMPLATE.markers.holidayDot.size / 2);
      expect(holidayDot.color).toBe(DEFAULT_MINI_TEMPLATE.markers.holidayDot.color);
    }

    const workdayDot = scene.nodes.find((n) => n.semanticId === "mini.workdayDot");
    expect(workdayDot).toBeDefined();
    if (workdayDot && workdayDot.kind === "dot") {
      expect(workdayDot.radius).toBe(DEFAULT_MINI_TEMPLATE.markers.workdayDot.size / 2);
      expect(workdayDot.color).toBe(DEFAULT_MINI_TEMPLATE.markers.workdayDot.color);
    }
  });

  it("changes date color for Japanese holiday but does not render holiday name", () => {
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

    const scene = layoutMini({
      calendar,
      template: DEFAULT_MINI_TEMPLATE,
      textMeasurer: fakeMeasurer,
    });

    // Date color should be Japan holiday color
    const dateNode = scene.nodes.find(
      (n) => n.semanticId === "mini.date" && n.kind === "text" && n.text === "5",
    );
    expect(dateNode).toBeDefined();
    if (dateNode && dateNode.kind === "text") {
      expect(dateNode.color).toBe(DEFAULT_MINI_TEMPLATE.colors.japanHoliday);
    }

    // No text node with holiday name
    const holidayNameNode = scene.nodes.find(
      (n) =>
        n.kind === "text" && (n.text === "こどもの日" || n.text === "端午节"),
    );
    expect(holidayNameNode).toBeUndefined();

    // China dot should still render
    const holidayDot = scene.nodes.find((n) => n.semanticId === "mini.holidayDot");
    expect(holidayDot).toBeDefined();
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
});
