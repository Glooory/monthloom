import { describe, expect, it } from "vitest";
import {
  resolveEffectiveRecords,
  resolveManagementRecords,
} from "./effectiveRecords";
import { base, fixtureLibrary, overrideDelete, overrideUpsert } from "./testFixtures";

describe("resolveEffectiveRecords", () => {
  it("resolves pure baseline records as provenance 'source'", () => {
    const library = fixtureLibrary({
      baseRecords: [base("cn", "2027-01-01", "holiday", "元旦")],
    });
    const effective = resolveEffectiveRecords(library, "cn");
    expect(effective.get("2027-01-01")).toEqual({
      calendarId: "cn",
      date: { year: 2027, month: 1, day: 1 },
      type: "holiday",
      name: "元旦",
      provenance: "source",
    });
  });

  it("prioritizes manual modifications over synchronized baseline", () => {
    const library = fixtureLibrary({
      baseRecords: [base("cn", "2027-01-01", "holiday", "元旦")],
      overrides: [overrideUpsert("cn", "2027-01-01", "holiday", "Custom New Year")],
    });
    const effective = resolveEffectiveRecords(library, "cn");
    expect(effective.get("2027-01-01")).toMatchObject({
      type: "holiday",
      name: "Custom New Year",
      provenance: "manual-modified",
    });
  });

  it("marks manual additions not present in baseline as 'manual-added'", () => {
    const library = fixtureLibrary({
      overrides: [overrideUpsert("cn", "2027-05-20", "holiday", "Special Day")],
    });
    const effective = resolveEffectiveRecords(library, "cn");
    expect(effective.get("2027-05-20")).toMatchObject({
      provenance: "manual-added",
    });
  });

  it("hides baseline records when a manual delete override exists", () => {
    const library = fixtureLibrary({
      baseRecords: [base("cn", "2027-02-06", "workday")],
      overrides: [overrideDelete("cn", "2027-02-06")],
    });
    const effective = resolveEffectiveRecords(library, "cn");
    expect(effective.has("2027-02-06")).toBe(false);
  });

  it("exposes deleted baseline records as 'manual-deleted' in resolveManagementRecords", () => {
    const library = fixtureLibrary({
      baseRecords: [base("cn", "2027-02-06", "workday", "春节补班")],
      overrides: [overrideDelete("cn", "2027-02-06")],
    });
    const management = resolveManagementRecords(library, "cn");
    expect(management).toHaveLength(1);
    expect(management[0]).toMatchObject({
      type: "workday",
      name: "春节补班",
      provenance: "manual-deleted",
    });
  });
});
