import { describe, it, expect } from "vitest";
import { createDefaultEditorDocument } from "../../editor/state/documentStore";
import {
  validateProjectSnapshot,
  validateTemplateSnapshot,
} from "./validation";
import type { ProjectSnapshotV1 } from "./projectSnapshot";
import type { TemplateSnapshotV1 } from "./templateSnapshot";

describe("Snapshot validation", () => {
  const defaultDoc = createDefaultEditorDocument();

  it("validates a valid ProjectSnapshotV1", () => {
    const snapshot: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "project-1",
      name: "2027 Calendar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
      chinaHolidayDataset: null,
      japanHolidayDataset: null,
      document: defaultDoc,
    };

    const validated = validateProjectSnapshot(snapshot);
    expect(validated.id).toBe("project-1");
    expect(validated.targetYear).toBe(2027);
  });

  it("rejects an invalid ProjectSnapshot missing required fields", () => {
    expect(() =>
      validateProjectSnapshot({
        version: 1,
        type: "project",
        id: "project-1",
        // missing name, targetYear, document
      }),
    ).toThrow();
  });

  it("validates a valid TemplateSnapshotV1", () => {
    const snapshot: TemplateSnapshotV1 = {
      version: 1,
      type: "template",
      id: "template-1",
      name: "Minimalist Template",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      document: defaultDoc,
    };

    const validated = validateTemplateSnapshot(snapshot);
    expect(validated.id).toBe("template-1");
  });

  it("validates ProjectSnapshot with custom weekday labels", () => {
    const docWithCustomWeekdays = {
      ...defaultDoc,
      mainTemplate: {
        ...defaultDoc.mainTemplate,
        weekdayRow: {
          ...defaultDoc.mainTemplate.weekdayRow,
          labels: ["日", "一", "二", "三", "四", "五", "六"],
        },
      },
      miniTemplate: {
        ...defaultDoc.miniTemplate,
        weekdayRow: {
          ...defaultDoc.miniTemplate.weekdayRow,
          labels: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        },
      },
    };

    const snapshot: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "project-custom",
      name: "Custom Weekday Calendar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
      chinaHolidayDataset: null,
      japanHolidayDataset: null,
      document: docWithCustomWeekdays,
    };

    const validated = validateProjectSnapshot(snapshot);
    expect(validated.document.mainTemplate.weekdayRow.labels).toEqual([
      "日",
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
    ]);
    expect(validated.document.miniTemplate.weekdayRow.labels).toEqual([
      "Su",
      "Mo",
      "Tu",
      "We",
      "Th",
      "Fr",
      "Sa",
    ]);
  });

  it("validates ProjectSnapshot with full weekday row settings", () => {
    const docWithFullWeekdaySettings = {
      ...defaultDoc,
      mainTemplate: {
        ...defaultDoc.mainTemplate,
        weekdayRow: {
          ...defaultDoc.mainTemplate.weekdayRow,
          labels: ["日", "一", "二", "三", "四", "五", "六"],
          startOfWeek: 1 as const,
          showBorder: true,
          borderWidth: 2,
          borderColor: "#333333",
          colors: {
            default: "#222222",
            sunday: "#FF0000",
            saturday: "#0000FF",
          },
        },
      },
    };

    const snapshot: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "project-full-weekday",
      name: "Full Weekday Settings Calendar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
      chinaHolidayDataset: null,
      japanHolidayDataset: null,
      document: docWithFullWeekdaySettings,
    };

    const validated = validateProjectSnapshot(snapshot);
    expect(validated.document.mainTemplate.weekdayRow.startOfWeek).toBe(1);
    expect(validated.document.mainTemplate.weekdayRow.showBorder).toBe(true);
    expect(validated.document.mainTemplate.weekdayRow.borderWidth).toBe(2);
    expect(validated.document.mainTemplate.weekdayRow.borderColor).toBe("#333333");
    expect(validated.document.mainTemplate.weekdayRow.colors?.sunday).toBe("#FF0000");
  });
});
