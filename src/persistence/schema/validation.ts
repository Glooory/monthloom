import { projectSnapshotV1Schema, type ProjectSnapshotV1 } from "./projectSnapshot";
import { templateSnapshotV1Schema, type TemplateSnapshotV1 } from "./templateSnapshot";

export function validateProjectSnapshot(raw: unknown): ProjectSnapshotV1 {
  const parsed = projectSnapshotV1Schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid project snapshot: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateTemplateSnapshot(raw: unknown): TemplateSnapshotV1 {
  const parsed = templateSnapshotV1Schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid template snapshot: ${parsed.error.message}`);
  }
  return parsed.data;
}
