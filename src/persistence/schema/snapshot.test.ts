import { describe, it, expect } from "vitest";
import { createDefaultEditorDocument } from "../../editor/state/documentStore";
import {
  validateHolidayLibrarySnapshot,
  validateProjectSnapshot,
  validateTemplateSnapshot,
} from "./validation";
import type { ProjectSnapshotV1 } from "./projectSnapshot";
import type { TemplateSnapshotV1 } from "./templateSnapshot";

describe("Snapshot validation", () => {
  const defaultDoc = createDefaultEditorDocument();

  it("validates a valid ProjectSnapshotV1 with holidayLayers", () => {
    const snapshot: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "project-1",
      name: "2027 Calendar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
      document: defaultDoc,
    };

    const validated = validateProjectSnapshot(snapshot);
    expect(validated.id).toBe("project-1");
    expect(validated.targetYear).toBe(2027);
    expect(validated.document.holidayLayers).toBeDefined();
    expect(validated.document.holidayLayers.length).toBeGreaterThan(0);
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
    expect(validated.document.holidayLayers).toBeDefined();
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
      document: docWithFullWeekdaySettings,
    };

    const validated = validateProjectSnapshot(snapshot);
    expect(validated.document.mainTemplate.weekdayRow.startOfWeek).toBe(1);
    expect(validated.document.mainTemplate.weekdayRow.showBorder).toBe(true);
    expect(validated.document.mainTemplate.weekdayRow.borderWidth).toBe(2);
    expect(validated.document.mainTemplate.weekdayRow.borderColor).toBe("#333333");
    expect(validated.document.mainTemplate.weekdayRow.colors?.sunday).toBe("#FF0000");
  });

  it("rejects impossible marker states in holiday layers", () => {
    const invalidDoc = {
      ...defaultDoc,
      holidayLayers: [
        {
          id: "layer-bad",
          calendarId: "cal-1",
          enabled: true,
          main: {
            showName: true,
            name: {
              position: { anchor: "bottom-left", offsetX: 0, offsetY: 0 },
              typography: {
                fontId: "default-sans",
                fontSize: 10,
                fontWeight: 400,
                fontStyle: "normal",
                letterSpacing: 0,
                color: "#000",
                opacity: 1,
              },
            },
            holidayMarker: {
              enabled: true,
              marker: {
                type: "image",
                // missing required assetId, width, height, opacity, position
              },
            },
            workdayMarker: {
              enabled: false,
              marker: {
                type: "text",
                value: "班",
                position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
                typography: {
                  fontId: "default-sans",
                  fontSize: 10,
                  fontWeight: 400,
                  fontStyle: "normal",
                  letterSpacing: 0,
                  color: "#000",
                  opacity: 1,
                },
              },
            },
            dateColors: { enabled: false, holiday: "#f00", workday: "#333" },
          },
          mini: {
            holidayMarker: {
              enabled: false,
              marker: {
                type: "text",
                value: "•",
                position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
                typography: {
                  fontId: "default-sans",
                  fontSize: 10,
                  fontWeight: 400,
                  fontStyle: "normal",
                  letterSpacing: 0,
                  color: "#f00",
                  opacity: 1,
                },
              },
            },
            workdayMarker: {
              enabled: false,
              marker: {
                type: "text",
                value: "•",
                position: { anchor: "top-right", offsetX: 0, offsetY: 0 },
                typography: {
                  fontId: "default-sans",
                  fontSize: 10,
                  fontWeight: 400,
                  fontStyle: "normal",
                  letterSpacing: 0,
                  color: "#666",
                  opacity: 1,
                },
              },
            },
            dateColors: { enabled: false, holiday: "#f00", workday: "#333" },
          },
        },
      ],
    };

    expect(() =>
      validateProjectSnapshot({
        version: 1,
        type: "project",
        id: "proj-bad-marker",
        name: "Bad Marker",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetYear: 2027,
        document: invalidDoc,
      }),
    ).toThrow();
  });

  it("rejects invalid calendar dates in holiday library schemas", () => {
    const invalidDateSnapshot = {
      calendars: [
        {
          id: "cal-1",
          name: "Test",
          builtin: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      baseRecords: [
        {
          id: "cal-1:2027-02-31",
          calendarId: "cal-1",
          date: { year: 2027, month: 2, day: 31 }, // February 31 is impossible
          type: "holiday",
          source: "sync",
          updatedAt: new Date().toISOString(),
        },
      ],
      overrides: [],
      coverage: [],
      syncStates: [],
    };

    expect(() =>
      validateHolidayLibrarySnapshot(invalidDateSnapshot),
    ).toThrow(/Invalid calendar date/);
  });

  it("rejects coverage with start date after end date", () => {
    const invalidCoverageSnapshot = {
      calendars: [],
      baseRecords: [],
      overrides: [],
      coverage: [
        {
          id: "cov-1",
          calendarId: "cal-1",
          start: { year: 2027, month: 12, day: 31 },
          end: { year: 2027, month: 1, day: 1 }, // start > end
          status: "confirmed",
          source: "manual",
          updatedAt: new Date().toISOString(),
        },
      ],
      syncStates: [],
    };

    expect(() =>
      validateHolidayLibrarySnapshot(invalidCoverageSnapshot),
    ).toThrow(/Coverage start date must be before or equal to end date/);
  });

  it("rejects holiday library snapshot with duplicate dates in baseRecords", () => {
    const snapshot = {
      calendars: [{ id: "cal-1", name: "Cal 1", builtin: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      baseRecords: [
        {
          id: "cal-1:2027-01-01",
          calendarId: "cal-1",
          date: { year: 2027, month: 1, day: 1 },
          type: "holiday",
          source: "sync",
          updatedAt: new Date().toISOString(),
        },
        {
          id: "cal-1:2027-01-01",
          calendarId: "cal-1",
          date: { year: 2027, month: 1, day: 1 },
          type: "workday",
          source: "sync",
          updatedAt: new Date().toISOString(),
        },
      ],
      overrides: [],
      coverage: [],
      syncStates: [],
    };

    expect(() => validateHolidayLibrarySnapshot(snapshot)).toThrow(/Duplicate date/);
  });

  it("rejects holiday library snapshot with duplicate dates in overrides", () => {
    const snapshot = {
      calendars: [{ id: "cal-1", name: "Cal 1", builtin: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      baseRecords: [],
      overrides: [
        {
          id: "cal-1:2027-01-01",
          calendarId: "cal-1",
          date: { year: 2027, month: 1, day: 1 },
          kind: "upsert",
          type: "holiday",
          updatedAt: new Date().toISOString(),
        },
        {
          id: "cal-1:2027-01-01",
          calendarId: "cal-1",
          date: { year: 2027, month: 1, day: 1 },
          kind: "delete",
          updatedAt: new Date().toISOString(),
        },
      ],
      coverage: [],
      syncStates: [],
    };

    expect(() => validateHolidayLibrarySnapshot(snapshot)).toThrow(/Duplicate date/);
  });

  it("rejects holiday library snapshot with non-canonical record IDs", () => {
    const snapshot = {
      calendars: [{ id: "cal-1", name: "Cal 1", builtin: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      baseRecords: [
        {
          id: "arbitrary-id-123",
          calendarId: "cal-1",
          date: { year: 2027, month: 1, day: 1 },
          type: "holiday",
          source: "sync",
          updatedAt: new Date().toISOString(),
        },
      ],
      overrides: [],
      coverage: [],
      syncStates: [],
    };

    expect(() => validateHolidayLibrarySnapshot(snapshot)).toThrow(/canonical ID/i);
  });

  it("rejects holiday library snapshot referencing unlisted calendar IDs", () => {
    const snapshot = {
      calendars: [{ id: "cal-1", name: "Cal 1", builtin: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      baseRecords: [
        {
          id: "cal-missing:2027-01-01",
          calendarId: "cal-missing",
          date: { year: 2027, month: 1, day: 1 },
          type: "holiday",
          source: "sync",
          updatedAt: new Date().toISOString(),
        },
      ],
      overrides: [],
      coverage: [],
      syncStates: [],
    };

    expect(() => validateHolidayLibrarySnapshot(snapshot)).toThrow(/unknown calendar/i);
  });

  it("rejects holiday library snapshot with duplicate sync states for the same calendar", () => {
    const snapshot = {
      calendars: [{ id: "cal-1", name: "Cal 1", builtin: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      baseRecords: [],
      overrides: [],
      coverage: [],
      syncStates: [
        { calendarId: "cal-1", status: "success", lastSuccessAt: new Date().toISOString() },
        { calendarId: "cal-1", status: "error", errorMessage: "Failed" },
      ],
    };

    expect(() => validateHolidayLibrarySnapshot(snapshot)).toThrow(/duplicate sync state/i);
  });

  it("rejects project snapshot with duplicate holiday layer IDs", () => {
    const docWithDuplicateLayerIds = {
      ...defaultDoc,
      holidayLayers: [
        { ...defaultDoc.holidayLayers[0], id: "layer-duplicate", calendarId: "cal-1" },
        { ...defaultDoc.holidayLayers[0], id: "layer-duplicate", calendarId: "cal-2" },
      ],
    };

    expect(() =>
      validateProjectSnapshot({
        version: 1,
        type: "project",
        id: "proj-duplicate-layers",
        name: "Duplicate Layers",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetYear: 2027,
        document: docWithDuplicateLayerIds,
      }),
    ).toThrow(/Duplicate holiday layer ID/);
  });

  it("rejects project snapshot with multiple layers binding to the same calendar ID", () => {
    const docWithDuplicateCalendarBindings = {
      ...defaultDoc,
      holidayLayers: [
        { ...defaultDoc.holidayLayers[0], id: "layer-1", calendarId: "same-calendar" },
        { ...defaultDoc.holidayLayers[0], id: "layer-2", calendarId: "same-calendar" },
      ],
    };

    expect(() =>
      validateProjectSnapshot({
        version: 1,
        type: "project",
        id: "proj-duplicate-bindings",
        name: "Duplicate Calendar Bindings",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetYear: 2027,
        document: docWithDuplicateCalendarBindings,
      }),
    ).toThrow(/Duplicate calendar binding/);
  });
});
