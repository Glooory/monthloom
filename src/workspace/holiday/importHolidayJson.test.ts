import { describe, it, expect } from "vitest";
import {
  parseChinaHolidayJsonString,
  parseJapanHolidayJsonString,
} from "./importHolidayJson";

describe("importHolidayJson", () => {
  it("parses valid China Timor holiday JSON string", () => {
    const jsonStr = JSON.stringify({
      code: 0,
      holiday: {
        "01-01": {
          holiday: true,
          name: "元旦",
          date: "2027-01-01",
        },
      },
    });

    const dataset = parseChinaHolidayJsonString(jsonStr);
    expect(dataset.source).toBe("china-timor");
    expect(dataset.entries).toHaveLength(1);
    expect(dataset.entries[0].info.china?.name).toBe("元旦");
    expect(dataset.diagnostics).toHaveLength(0);
  });

  it("handles malformed JSON string gracefully with error diagnostic", () => {
    const dataset = parseChinaHolidayJsonString("invalid json string");
    expect(dataset.entries).toHaveLength(0);
    expect(dataset.diagnostics.some((d) => d.level === "error")).toBe(true);
  });

  it("parses valid Japan holiday JSON string", () => {
    const jsonStr = JSON.stringify({
      "2027-01-01": "元日",
    });

    const dataset = parseJapanHolidayJsonString(jsonStr);
    expect(dataset.source).toBe("japan-holidays-jp");
    expect(dataset.entries).toHaveLength(1);
    expect(dataset.entries[0].info.japan?.name).toBe("元日");
    expect(dataset.diagnostics).toHaveLength(0);
  });
});
