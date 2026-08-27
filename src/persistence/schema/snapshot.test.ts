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
});
