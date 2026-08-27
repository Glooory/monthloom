import type { RenderScene, Rect } from "../../rendering/scene/types";
import type { PositionableSemanticId } from "../model/types";
import type { Position } from "../../domain/template/primitives";

export type EditorHitTarget = Readonly<{
  semanticId: PositionableSemanticId;
  instanceKey: string;
  bounds: Rect;
  cell: Rect;
  position: Position;
}>;

const MIN_HIT_SIZE = 12;

export function getInteractiveHitBounds(bounds: Rect): Rect {
  const width = Math.max(bounds.width, MIN_HIT_SIZE);
  const height = Math.max(bounds.height, MIN_HIT_SIZE);
  const x = bounds.x - (width - bounds.width) / 2;
  const y = bounds.y - (height - bounds.height) / 2;
  return { x, y, width, height };
}

export function isPointInRect(pt: { x: number; y: number }, rect: Rect): boolean {
  return (
    pt.x >= rect.x &&
    pt.x <= rect.x + rect.width &&
    pt.y >= rect.y &&
    pt.y <= rect.y + rect.height
  );
}

export function buildEditorHitTargets(scene: RenderScene): readonly EditorHitTarget[] {
  const targets: EditorHitTarget[] = [];

  for (const node of scene.nodes) {
    if (node.kind === "line" || node.kind === "rect" || node.semanticId === "main.grid") {
      continue;
    }

    const semanticId = node.semanticId as PositionableSemanticId;
    const instanceKey = node.instanceKey ?? `${semanticId}:default`;

    if (node.kind === "text") {
      const top = node.baselineY - node.metrics.ascent;
      const height = node.metrics.ascent - node.metrics.descent;
      const bounds: Rect = {
        x: node.originX,
        y: top,
        width: node.metrics.width,
        height,
      };

      targets.push({
        semanticId,
        instanceKey,
        bounds,
        cell: node.cell,
        position: node.position,
      });
    } else if (node.kind === "image") {
      const bounds: Rect = {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
      };

      if (node.cell && node.position) {
        targets.push({
          semanticId,
          instanceKey,
          bounds,
          cell: node.cell,
          position: node.position,
        });
      }
    } else if (node.kind === "dot") {
      const bounds: Rect = {
        x: node.cx - node.radius,
        y: node.cy - node.radius,
        width: node.radius * 2,
        height: node.radius * 2,
      };

      if (node.cell && node.position) {
        targets.push({
          semanticId,
          instanceKey,
          bounds,
          cell: node.cell,
          position: node.position,
        });
      }
    }
  }

  return targets;
}

export function findHitTargetAtPoint(
  targets: readonly EditorHitTarget[],
  point: { x: number; y: number },
): EditorHitTarget | null {
  // Search in reverse order so topmost rendered elements get priority
  for (let i = targets.length - 1; i >= 0; i--) {
    const target = targets[i];
    const hitBounds = getInteractiveHitBounds(target.bounds);
    if (isPointInRect(point, hitBounds)) {
      return target;
    }
  }
  return null;
}
