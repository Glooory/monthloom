import { describe, expect, it } from "vitest";
import {
  buildHolidaySemanticId,
  parseHolidaySemanticId,
} from "./holidaySemanticId";

describe("holidaySemanticId", () => {
  it("builds and parses Main holiday semantic IDs roundtrip", () => {
    const nameId = buildHolidaySemanticId("main", "layer-1", "name");
    expect(nameId).toBe("main.holiday.layer-1.name");
    expect(parseHolidaySemanticId(nameId)).toEqual({
      target: "main",
      layerId: "layer-1",
      element: "name",
    });

    const markerId = buildHolidaySemanticId("main", "layer-1", "holidayMarker");
    expect(markerId).toBe("main.holiday.layer-1.holidayMarker");
    expect(parseHolidaySemanticId(markerId)).toEqual({
      target: "main",
      layerId: "layer-1",
      element: "holidayMarker",
    });
  });

  it("builds and parses Mini holiday semantic IDs roundtrip", () => {
    const markerId = buildHolidaySemanticId("mini", "layer-2", "workdayMarker");
    expect(markerId).toBe("mini.holiday.layer-2.workdayMarker");
    expect(parseHolidaySemanticId(markerId)).toEqual({
      target: "mini",
      layerId: "layer-2",
      element: "workdayMarker",
    });
  });

  it("rejects mini name semantic IDs", () => {
    expect(() => buildHolidaySemanticId("mini", "layer-1", "name")).toThrow(
      /Mini calendars do not support holiday names/,
    );
    expect(parseHolidaySemanticId("mini.holiday.layer-1.name")).toBeNull();
  });

  it("normalizes kebab-case element names", () => {
    expect(parseHolidaySemanticId("main.holiday.l1.holiday-marker")).toEqual({
      target: "main",
      layerId: "l1",
      element: "holidayMarker",
    });
  });
});
