import { describe, expect, it } from "vitest";
import { createDefaultHolidayLayers } from "../template/holidayLayer";
import { resolveHolidayIndex } from "./resolveHolidayIndex";
import {
  base,
  fixtureLibrary,
  overrideUpsert,
  overrideDelete,
} from "./testFixtures";

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

describe("Chinese festival labels", () => {
  const [layer] = createDefaultHolidayLayers();

  it("labels Labor Day once while retaining all five rest days", () => {
    const library = fixtureLibrary({
      baseRecords: [1, 2, 3, 4, 5].map((day) =>
        base(layer.calendarId, `2027-05-0${day}`, "holiday", "劳动节"),
      ),
    });
    const index = resolveHolidayIndex({
      library,
      layers: [layer],
      targetYear: 2027,
    });
    expect(index.get("2027-05-01")?.occurrences[0].name).toBe("劳动节");
    for (const day of [2, 3, 4, 5]) {
      expect(index.get(`2027-05-0${day}`)?.occurrences[0]).toMatchObject({
        type: "holiday",
      });
      expect(index.get(`2027-05-0${day}`)?.occurrences[0].name).toBeUndefined();
    }
  });

  it("replaces lunar day labels with Spring Festival and keeps New Year's Eve", () => {
    const library = fixtureLibrary({
      baseRecords: [
        base(layer.calendarId, "2027-02-05", "holiday", "除夕"),
        base(layer.calendarId, "2027-02-06", "holiday", "初一"),
        base(layer.calendarId, "2027-02-07", "holiday", "初二"),
      ],
    });
    const index = resolveHolidayIndex({
      library,
      layers: [layer],
      targetYear: 2027,
    });
    expect(index.get("2027-02-05")?.occurrences[0].name).toBe("除夕");
    expect(index.get("2027-02-06")?.occurrences[0].name).toBe("春节");
    expect(index.get("2027-02-07")?.occurrences[0].name).toBeUndefined();
  });

  it("calculates festivals without source data, including adjacent years, without inventing rest days or colors", () => {
    const coloredLayer = {
      ...layer,
      main: {
        ...layer.main,
        dateColors: { ...layer.main.dateColors, enabled: true },
      },
    };
    const index = resolveHolidayIndex({
      library: fixtureLibrary(),
      layers: [coloredLayer],
      targetYear: 2027,
    });
    for (const [date, name] of [
      ["2026-01-01", "元旦"],
      ["2027-04-05", "清明节"],
      ["2027-06-09", "端午节"],
      ["2027-09-15", "中秋节"],
      ["2027-10-01", "国庆节"],
      ["2028-01-26", "春节"],
    ]) {
      const entry = index.get(date);
      expect(entry?.occurrences[0].name).toBe(name);
      expect(entry?.occurrences[0].type).toBeUndefined();
      expect(entry?.mainDateColor).toBeUndefined();
    }
  });

  it("keeps both festivals when Mid-Autumn Festival coincides with National Day", () => {
    const index = resolveHolidayIndex({
      library: fixtureLibrary(),
      layers: [layer],
      targetYear: 2020,
    });
    expect(index.get("2020-10-01")?.occurrences[0].name).toBe("国庆节、中秋节");
  });

  it("lets manual overrides rename, hide, add, and delete calculated labels", () => {
    const library = fixtureLibrary({
      overrides: [
        overrideUpsert(layer.calendarId, "2027-02-06", "holiday", "新春"),
        overrideUpsert(layer.calendarId, "2027-04-05", "holiday"),
        overrideUpsert(layer.calendarId, "2027-06-01", "holiday", "儿童节"),
        overrideDelete(layer.calendarId, "2027-05-01"),
      ],
    });
    const index = resolveHolidayIndex({
      library,
      layers: [layer],
      targetYear: 2027,
    });
    expect(index.get("2027-02-06")?.occurrences[0].name).toBe("新春");
    expect(index.get("2027-04-05")?.occurrences[0].name).toBeUndefined();
    expect(index.get("2027-06-01")?.occurrences[0].name).toBe("儿童节");
    expect(index.has("2027-05-01")).toBe(false);
  });
});

describe("festival and leave independence", () => {
  const [cn, jp] = createDefaultHolidayLayers();

  it("preserves a source workday status on a calculated festival date", () => {
    const library = fixtureLibrary({
      baseRecords: [
        base(cn.calendarId, "2027-02-06", "workday", "provider-specific name"),
      ],
    });
    const index = resolveHolidayIndex({
      library,
      layers: [cn],
      targetYear: 2027,
    });
    expect(index.get("2027-02-06")?.occurrences[0]).toMatchObject({
      type: "workday",
      name: "春节",
    });
  });

  it("keeps manual modifications ahead of calculated and imported labels", () => {
    const library = fixtureLibrary({
      baseRecords: [base(cn.calendarId, "2027-02-06", "holiday", "初一")],
      overrides: [
        overrideUpsert(cn.calendarId, "2027-02-06", "holiday", "新春"),
      ],
    });
    expect(
      resolveHolidayIndex({ library, layers: [cn], targetYear: 2027 }).get(
        "2027-02-06",
      )?.occurrences[0].name,
    ).toBe("新春");
  });

  it("preserves Japanese and custom names without generating Chinese festivals", () => {
    const custom = { ...cn, id: "custom", calendarId: "custom-calendar" };
    const library = fixtureLibrary({
      baseRecords: [
        base(jp.calendarId, "2027-05-03", "holiday", "憲法記念日"),
        base(custom.calendarId, "2027-05-02", "holiday", "Anniversary"),
      ],
    });
    const index = resolveHolidayIndex({
      library,
      layers: [custom, jp],
      targetYear: 2027,
    });
    expect(index.get("2027-05-03")?.occurrences[0].name).toBe("憲法記念日");
    expect(index.get("2027-05-02")?.occurrences[0].name).toBe("Anniversary");
    expect(index.has("2027-02-06")).toBe(false);
  });
});
