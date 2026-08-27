import type { EditorSelection, EditableSemanticId } from "../model/types";
import type { EditorHitTarget } from "./hitTargets";

export function findTargetByInstanceKey(
  targets: readonly EditorHitTarget[],
  instanceKey: string | null | undefined,
): EditorHitTarget | null {
  if (!instanceKey) return null;
  return targets.find((t) => t.instanceKey === instanceKey) ?? null;
}

export function findFirstTargetBySemanticId(
  targets: readonly EditorHitTarget[],
  semanticId: EditableSemanticId | null | undefined,
): EditorHitTarget | null {
  if (!semanticId) return null;
  return targets.find((t) => t.semanticId === semanticId) ?? null;
}

export function resolveSelectedTarget(
  targets: readonly EditorHitTarget[],
  selection: EditorSelection | null | undefined,
): EditorHitTarget | null {
  if (!selection) return null;
  const byInstance = findTargetByInstanceKey(targets, selection.instanceKey);
  if (byInstance) return byInstance;
  return findFirstTargetBySemanticId(targets, selection.semanticId);
}
