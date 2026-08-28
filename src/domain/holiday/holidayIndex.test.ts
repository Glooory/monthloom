import { describe, expect, it } from "vitest";
import { createDefaultHolidayLayers } from "../template/holidayLayer";
import { resolveHolidayIndex } from "./resolveHolidayIndex";
import { base, fixtureLibrary } from "./testFixtures";

describe("resolveHolidayIndex", () => {
  it("resolves multi-layer occurrences and later layer date text color override", () => {
    const [cnLayer, jpLayer] = createDefaultHolidayLayers();
    const library = fixtureLibrary({
      baseRecords: [
        base(cnLayer.calendarId, "2027-01-01", "holiday", "元旦"),
        base(jpLayer.calendarId, "2027-01-01", "holiday", "元日"),
      ],
    });

    const index = resolveHolidayIndex({ library, layers: [cnLayer, jpLayer] });
    const resolved = index.get("2027-01-01");
    expect(resolved).toBeDefined();
    expect(resolved?.occurrences).toHaveLength(2);
    expect(resolved?.occurrences[0]).toMatchObject({
      calendarId: cnLayer.calendarId,
      name: "元旦",
    });
    expect(resolved?.occurrences[1]).toMatchObject({
      calendarId: jpLayer.calendarId,
      name: "元日",
    });
    expect(resolved?.mainDateColor).toBe(jpLayer.main.dateColors.holiday);
    expect(resolved?.miniDateColor).toBe(jpLayer.mini.dateColors.holiday);
  });

  it("ignores disabled layers", () => {
    const [cnLayer, jpLayer] = createDefaultHolidayLayers();
    const disabledCn = { ...cnLayer, enabled: false };
    const library = fixtureLibrary({
      baseRecords: [
        base(cnLayer.calendarId, "2027-01-01", "holiday", "元旦"),
        base(jpLayer.calendarId, "2027-01-01", "holiday", "元日"),
      ],
    });

    const index = resolveHolidayIndex({
      library,
      layers: [disabledCn, jpLayer],
    });
    const resolved = index.get("2027-01-01");
    expect(resolved?.occurrences).toHaveLength(1);
    expect(resolved?.occurrences[0].calendarId).toBe(jpLayer.calendarId);
  });
});
