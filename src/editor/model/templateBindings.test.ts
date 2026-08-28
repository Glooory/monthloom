import { describe, it, expect } from "vitest";
import { createDefaultEditorDocument } from "../state/documentStore";
import {
  getElementPosition,
  setElementPosition,
  getTypography,
  setTypography,
  getCalendarColors,
  setCalendarColors,
  getGridBorder,
  setGridBorder,
  getMarkerDetails,
  setMarkerDetails,
  getDotDetails,
  setDotDetails,
  getWeekdayLabels,
  setWeekdayLabels,
} from "./templateBindings";
import type { PositionableSemanticId } from "./types";

describe("templateBindings", () => {
  const allPositionableIds: PositionableSemanticId[] = [
    "main.weekday",
    "main.date",
    "main.chinaHolidayName",
    "main.japanHolidayName",
    "main.chinaHolidayMarker",
    "main.chinaWorkdayMarker",
    "mini.monthLabel",
    "mini.weekday",
    "mini.date",
    "mini.holidayDot",
    "mini.workdayDot",
  ];

  it("round-trips position for every positionable semantic ID without altering other fields", () => {
    let doc = createDefaultEditorDocument();

    for (const id of allPositionableIds) {
      const originalPos = getElementPosition(doc, id);
      expect(originalPos).toBeDefined();

      const newPos = { anchor: "bottom-right" as const, offsetX: 77, offsetY: -33 };
      const updatedDoc = setElementPosition(doc, id, newPos);
      expect(getElementPosition(updatedDoc, id)).toEqual(newPos);

      // Verify original document was not mutated
      expect(getElementPosition(doc, id)).toEqual(originalPos);
      doc = updatedDoc;
    }
  });

  it("handles typography get and set for supported elements", () => {
    const doc = createDefaultEditorDocument();

    const dateTypo = getTypography(doc, "main.date");
    expect(dateTypo).toBeDefined();
    expect(dateTypo?.fontSize).toBe(18);

    const updatedDoc = setTypography(doc, "main.date", {
      ...dateTypo!,
      fontSize: 24,
    });
    expect(getTypography(updatedDoc, "main.date")?.fontSize).toBe(24);

    // Mini dot should return null
    expect(getTypography(doc, "mini.holidayDot")).toBeNull();
    // main.grid should return null
    expect(getTypography(doc, "main.grid")).toBeNull();
  });

  it("handles calendar colors get and set for main and mini", () => {
    const doc = createDefaultEditorDocument();

    const mainColors = getCalendarColors(doc, "main");
    expect(mainColors.sunday).toBe("#DC2626");

    const updatedMain = setCalendarColors(doc, "main", {
      ...mainColors,
      sunday: "#FF0000",
    });
    expect(getCalendarColors(updatedMain, "main").sunday).toBe("#FF0000");
    // Mini colors unaffected
    expect(getCalendarColors(updatedMain, "mini").sunday).toBe("#DC2626");
  });

  it("handles grid border get and set", () => {
    const doc = createDefaultEditorDocument();

    const border = getGridBorder(doc);
    expect(border.borderWidth).toBe(1);

    const updated = setGridBorder(doc, { borderWidth: 3, borderColor: "#000000" });
    expect(getGridBorder(updated)).toEqual({ borderWidth: 3, borderColor: "#000000" });
  });

  it("handles marker get, set, and type toggle", () => {
    const doc = createDefaultEditorDocument();

    const holidayMarker = getMarkerDetails(doc, "main.chinaHolidayMarker");
    expect(holidayMarker.type).toBe("text");

    const imageMarkerDoc = setMarkerDetails(doc, "main.chinaHolidayMarker", {
      type: "image",
      assetId: "asset-123",
      width: 16,
      height: 16,
      position: holidayMarker.position,
      opacity: 0.8,
    });

    const updatedMarker = getMarkerDetails(imageMarkerDoc, "main.chinaHolidayMarker");
    expect(updatedMarker.type).toBe("image");
    if (updatedMarker.type === "image") {
      expect(updatedMarker.assetId).toBe("asset-123");
    }
  });

  it("handles mini dot get and set", () => {
    const doc = createDefaultEditorDocument();

    const dot = getDotDetails(doc, "mini.holidayDot");
    expect(dot.size).toBe(4);

    const updated = setDotDetails(doc, "mini.holidayDot", {
      ...dot,
      size: 6,
      color: "#00FF00",
    });
    expect(getDotDetails(updated, "mini.holidayDot")).toEqual({
      ...dot,
      size: 6,
      color: "#00FF00",
    });
  });

  it("handles weekday labels get and set for main and mini templates", () => {
    const doc = createDefaultEditorDocument();

    const mainLabels = getWeekdayLabels(doc, "main");
    expect(mainLabels).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);

    const customMain = ["日", "一", "二", "三", "四", "五", "六"];
    const updatedMain = setWeekdayLabels(doc, "main", customMain);
    expect(getWeekdayLabels(updatedMain, "main")).toEqual(customMain);
    expect(getWeekdayLabels(updatedMain, "mini")).toEqual(["S", "M", "T", "W", "T", "F", "S"]);

    const customMini = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const updatedMini = setWeekdayLabels(updatedMain, "mini", customMini);
    expect(getWeekdayLabels(updatedMini, "mini")).toEqual(customMini);
    expect(getWeekdayLabels(updatedMini, "main")).toEqual(customMain);
  });
});
