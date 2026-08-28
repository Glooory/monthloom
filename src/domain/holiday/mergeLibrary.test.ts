import { describe, expect, it } from "vitest";
import { mergeHolidayLibraries } from "./mergeLibrary";
import { base, fixtureLibrary, overrideUpsert } from "./testFixtures";

describe("mergeHolidayLibraries", () => {
  it("preserves local manual overrides on conflict while importing new baseline records", () => {
    const local = fixtureLibrary({
      baseRecords: [base("cal-1", "2027-01-01", "holiday", "Local New Year")],
      overrides: [
        overrideUpsert(
          "cal-1",
          "2027-01-01",
          "holiday",
          "My Custom Local Override",
        ),
      ],
    });

    const incoming = fixtureLibrary({
      baseRecords: [
        base("cal-1", "2027-01-01", "holiday", "Incoming New Year"),
        base("cal-1", "2027-05-01", "holiday", "Labor Day"),
      ],
      overrides: [
        overrideUpsert(
          "cal-1",
          "2027-01-01",
          "holiday",
          "Incoming Override that should be skipped",
        ),
        overrideUpsert(
          "cal-1",
          "2027-05-01",
          "holiday",
          "Incoming Non-conflicting Override",
        ),
      ],
    });

    const result = mergeHolidayLibraries(local, incoming);
    expect(result.skippedOverrideConflicts).toBe(1);
    expect(result.summary.skippedOverrideConflicts).toBe(1);
    expect(result.summary.addedRecords).toBe(2); // 1 new base record (2027-05-01) + 1 new override (2027-05-01)
    expect(result.summary.addedCalendars).toBe(0);
    expect(result.merged.baseRecords).toHaveLength(2);
    expect(result.merged.overrides).toHaveLength(2);

    const jan1Override = result.merged.overrides.find(
      (o) => o.id === "cal-1:2027-01-01",
    );
    expect((jan1Override as any)?.name).toBe("My Custom Local Override");
  });
});

