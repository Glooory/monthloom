import { describe, expect, it } from "vitest";
import { getChineseFestivals } from "./chineseFestivals";

describe("getChineseFestivals", () => {
  it.each([
    [
      2024,
      "2024-02-09",
      "2024-02-10",
      "2024-04-04",
      "2024-06-10",
      "2024-09-17",
    ],
    [
      2026,
      "2026-02-16",
      "2026-02-17",
      "2026-04-05",
      "2026-06-19",
      "2026-09-25",
    ],
    [
      2027,
      "2027-02-05",
      "2027-02-06",
      "2027-04-05",
      "2027-06-09",
      "2027-09-15",
    ],
  ])(
    "calculates the eight selected festivals for %i",
    (year, eve, spring, qingming, dragonBoat, midAutumn) => {
      expect(getChineseFestivals(year)).toEqual(
        new Map([
          [`${year}-01-01`, "元旦"],
          [`${year}-05-01`, "劳动节"],
          [`${year}-10-01`, "国庆节"],
          [eve, "除夕"],
          [spring, "春节"],
          [qingming, "清明节"],
          [dragonBoat, "端午节"],
          [midAutumn, "中秋节"],
        ]),
      );
    },
  );

  it("does not duplicate festivals in a leap lunar month", () => {
    const festivals = getChineseFestivals(2009); // Leap fifth month.
    expect(festivals.get("2009-05-28")).toBe("端午节");
    expect(festivals.has("2009-06-27")).toBe(false);
    expect(
      Array.from(festivals.values()).filter((name) => name === "端午节"),
    ).toHaveLength(1);
  });
});
