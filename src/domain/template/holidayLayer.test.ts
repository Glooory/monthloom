import { describe, expect, it } from "vitest";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  BUILTIN_JAPAN_CALENDAR_ID,
} from "../holiday/types";
import {
  addHolidayLayer,
  createDefaultCustomHolidayLayer,
  createDefaultHolidayLayers,
  ensureLayerFontDescriptors,
  moveHolidayLayer,
  rebindHolidayLayer,
  removeHolidayLayer,
  updateHolidayLayer,
} from "./holidayLayer";

describe("holidayLayer domain", () => {
  it("creates default layers for China and Japan with unique calendar IDs", () => {
    const layers = createDefaultHolidayLayers();
    expect(layers).toHaveLength(2);
    expect(layers[0].calendarId).toBe(BUILTIN_CHINA_CALENDAR_ID);
    expect(layers[1].calendarId).toBe(BUILTIN_JAPAN_CALENDAR_ID);
    expect(layers[0].main.showName).toBe(true);
    expect(layers[0].main.holidayMarker.enabled).toBe(true);
    expect(layers[1].main.dateColors.enabled).toBe(true);
  });

  it("enforces 1:1 calendar-to-layer constraint in a template", () => {
    const layers = createDefaultHolidayLayers();
    expect(() =>
      addHolidayLayer(layers, { ...layers[0], id: "layer-new" }),
    ).toThrow(/already has a layer/);
  });

  it("supports reordering layers", () => {
    const layers = createDefaultHolidayLayers();
    const moved = moveHolidayLayer(layers, layers[0].id, 1);
    expect(moved[0].calendarId).toBe(BUILTIN_JAPAN_CALENDAR_ID);
    expect(moved[1].calendarId).toBe(BUILTIN_CHINA_CALENDAR_ID);
  });

  it("supports updating a layer", () => {
    const layers = createDefaultHolidayLayers();
    const updated = updateHolidayLayer(layers, layers[0].id, (layer) => ({
      ...layer,
      enabled: false,
    }));
    expect(updated[0].enabled).toBe(false);
  });

  it("supports removing a layer", () => {
    const layers = createDefaultHolidayLayers();
    const removed = removeHolidayLayer(layers, layers[0].id);
    expect(removed).toHaveLength(1);
    expect(removed[0].id).toBe(layers[1].id);
  });

  it("supports rebinding a layer to an unassigned calendar", () => {
    const layers = createDefaultHolidayLayers();
    const remapped = rebindHolidayLayer(
      layers,
      layers[0].id,
      "custom-calendar-id",
    );
    expect(remapped[0].calendarId).toBe("custom-calendar-id");
  });

  it("rejects rebinding to an already assigned calendar", () => {
    const layers = createDefaultHolidayLayers();
    expect(() =>
      rebindHolidayLayer(layers, layers[0].id, BUILTIN_JAPAN_CALENDAR_ID),
    ).toThrow();
  });

  it("ensures custom holiday layer registers missing font descriptors in catalog", () => {
    const customLayer = createDefaultCustomHolidayLayer("cal-custom", "layer-custom-1");
    const initialCatalog: any = {
      "default-sans": {
        family: "Noto Sans",
        weight: 400,
        style: "normal",
        source: { type: "google", family: "Noto Sans" },
      },
    };

    const nextCatalog = ensureLayerFontDescriptors(initialCatalog, customLayer);
    expect(nextCatalog["main.holiday.layer-custom-1.name"]).toBeDefined();
    expect(nextCatalog["main.holiday.layer-custom-1.holidayMarker"]).toBeDefined();
    expect(nextCatalog["main.holiday.layer-custom-1.workdayMarker"]).toBeDefined();
  });

  it("throws descriptive error when ensuring font descriptors if no source or default-sans exists", () => {
    const customLayer = createDefaultCustomHolidayLayer("cal-custom", "layer-custom-2");
    const emptyCatalog: any = {};

    expect(() => ensureLayerFontDescriptors(emptyCatalog, customLayer)).toThrow(
      /no valid source font descriptor or 'default-sans'/i,
    );
  });
});

