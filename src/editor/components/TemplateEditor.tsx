import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { BinaryAssetResolver } from "../../resources/assets/types";
import type { SvgDocument } from "../../rendering/svg/document";
import type { RenderScene } from "../../rendering/scene/types";
import type { PositionableSemanticId } from "../model/types";
import type { Anchor } from "../../domain/template/primitives";
import { useDocumentStore } from "../state/documentStore";
import { useUiStore } from "../state/uiStore";
import { createEffectiveDocument } from "../model/effectiveDocument";
import { useEditorFontEngine } from "../fonts/useEditorFontEngine";
import { memoryAssetStore } from "../assets/memoryAssetStore";
import { layoutMain } from "../../rendering/layout/mainLayout";
import { layoutMini } from "../../rendering/layout/miniLayout";
import { materializeSvg } from "../../rendering/svg/materialize";
import { clientDeltaToSceneDelta } from "../interaction/pointerDelta";
import { applyDragCommit } from "../interaction/drag";
import { applyWeekdayResizeCommit } from "../interaction/weekdayResize";
import { calculatePositionForAnchorChange } from "../interaction/anchorChange";
import { matchUndoRedoShortcut } from "../interaction/keyboardShortcuts";
import { setElementPosition } from "../model/templateBindings";
import { buildEditorHitTargets } from "../selection/hitTargets";
import { resolveSelectedTarget } from "../selection/selection";
import { EditorToolbar } from "./EditorToolbar";
import { EditorCanvas } from "./EditorCanvas";
import { Inspector } from "./Inspector";
import "./editor.css";

export interface TemplateEditorProps {
  calendar: CalendarMonth;
  weekdays?: readonly string[];
  fetchImpl?: typeof fetch;
  assetResolver?: BinaryAssetResolver;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  calendar,
  weekdays,
  fetchImpl,
  assetResolver = memoryAssetStore,
}) => {
  const document = useDocumentStore((s) => s.document);
  const commitDocument = useDocumentStore((s) => s.commitDocument);

  // Subscribe to temporal history state for undo/redo button enabled status
  const temporal = useDocumentStore.temporal;
  const canUndo = useSyncExternalStore(
    temporal.subscribe,
    () => temporal.getState().pastStates.length > 0,
    () => false,
  );
  const canRedo = useSyncExternalStore(
    temporal.subscribe,
    () => temporal.getState().futureStates.length > 0,
    () => false,
  );

  const {
    activeTemplate,
    selection,
    drag,
    weekdayResize,
    setActiveTemplate,
    setSelection,
    setDrag,
    setWeekdayResize,
  } = useUiStore();

  const [svgDocument, setSvgDocument] = useState<SvgDocument | null>(null);

  // Derive transient effective document
  const effectiveDocument = useMemo(() => {
    return createEffectiveDocument({
      document,
      drag,
      weekdayResize,
    });
  }, [document, drag, weekdayResize]);

  // Load font engine with requirement stability
  const { fontEngine, error: fontError } = useEditorFontEngine({
    calendar,
    document: effectiveDocument,
    assetResolver,
    fetchImpl,
  });

  // Calculate layout scene
  const scene: RenderScene | null = useMemo(() => {
    if (!fontEngine) return null;

    if (activeTemplate === "main") {
      return layoutMain({
        calendar,
        template: effectiveDocument.mainTemplate,
        textMeasurer: fontEngine,
        weekdays,
      });
    } else {
      return layoutMini({
        calendar,
        template: effectiveDocument.miniTemplate,
        textMeasurer: fontEngine,
        weekdays,
      });
    }
  }, [fontEngine, activeTemplate, calendar, effectiveDocument, weekdays]);

  // Materialize SVG document when scene or fontEngine changes
  useEffect(() => {
    if (!scene || !fontEngine) return;

    let isMounted = true;
    materializeSvg({
      scene,
      mode: "outlined",
      fontEngine,
      assetResolver,
    })
      .then((doc) => {
        if (isMounted) {
          setSvgDocument(doc);
        }
      })
      .catch((err) => {
        console.error("Failed to materialize SVG:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [scene, fontEngine, assetResolver]);

  // Drag interaction tracking
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    semanticId: PositionableSemanticId;
    instanceKey: string;
  } | null>(null);

  const handleStartDrag = (
    semanticId: PositionableSemanticId,
    instanceKey: string,
    clientX: number,
    clientY: number,
  ) => {
    dragStartRef.current = { clientX, clientY, semanticId, instanceKey };
    setDrag({ semanticId, instanceKey, deltaX: 0, deltaY: 0 });
  };

  const handleMoveDrag = (
    clientX: number,
    clientY: number,
    renderedBounds: DOMRect,
  ) => {
    if (!dragStartRef.current || !scene) return;

    const clientDeltaX = clientX - dragStartRef.current.clientX;
    const clientDeltaY = clientY - dragStartRef.current.clientY;

    const sceneDelta = clientDeltaToSceneDelta({
      clientDeltaX,
      clientDeltaY,
      renderedWidth: renderedBounds.width,
      renderedHeight: renderedBounds.height,
      sceneWidth: scene.width,
      sceneHeight: scene.height,
    });

    setDrag({
      semanticId: dragStartRef.current.semanticId,
      instanceKey: dragStartRef.current.instanceKey,
      deltaX: Math.round(sceneDelta.x),
      deltaY: Math.round(sceneDelta.y),
    });
  };

  const handleEndDrag = () => {
    if (drag && (drag.deltaX !== 0 || drag.deltaY !== 0)) {
      const nextDoc = applyDragCommit(document, drag);
      commitDocument(nextDoc);
    }
    dragStartRef.current = null;
    setDrag(null);
  };

  const handleCancelDrag = () => {
    dragStartRef.current = null;
    setDrag(null);
  };

  // Weekday Row Resize interaction tracking
  const resizeStartRef = useRef<{ clientY: number } | null>(null);

  const handleStartWeekdayResize = (clientY: number) => {
    resizeStartRef.current = { clientY };
    setWeekdayResize({ deltaY: 0 });
  };

  const handleMoveWeekdayResize = (clientY: number, renderedBounds: DOMRect) => {
    if (!resizeStartRef.current || !scene) return;

    const clientDeltaY = clientY - resizeStartRef.current.clientY;
    const sceneDelta = clientDeltaToSceneDelta({
      clientDeltaX: 0,
      clientDeltaY,
      renderedWidth: renderedBounds.width,
      renderedHeight: renderedBounds.height,
      sceneWidth: scene.width,
      sceneHeight: scene.height,
    });

    setWeekdayResize({ deltaY: Math.round(sceneDelta.y) });
  };

  const handleEndWeekdayResize = () => {
    if (weekdayResize && weekdayResize.deltaY !== 0) {
      const nextDoc = applyWeekdayResizeCommit(document, weekdayResize);
      commitDocument(nextDoc);
    }
    resizeStartRef.current = null;
    setWeekdayResize(null);
  };

  // Anchor selection handler
  const handleSelectAnchor = (nextAnchor: Anchor) => {
    if (!scene || !selection) return;
    const targets = buildEditorHitTargets(scene);
    const selectedTarget = resolveSelectedTarget(targets, selection);
    if (!selectedTarget) return;

    const newPos = calculatePositionForAnchorChange({
      cell: selectedTarget.cell,
      visualBounds: selectedTarget.bounds,
      nextAnchor,
    });

    commitDocument(setElementPosition(document, selectedTarget.semanticId, newPos));
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    setDrag(null);
    setWeekdayResize(null);
    temporal.getState().undo();
  };

  const handleRedo = () => {
    setDrag(null);
    setWeekdayResize(null);
    temporal.getState().redo();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = matchUndoRedoShortcut(e);
      if (action === "undo" && canUndo) {
        e.preventDefault();
        handleUndo();
      } else if (action === "redo" && canRedo) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Escape") {
        handleCancelDrag();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canUndo, canRedo]);

  return (
    <div className="monthloom-editor">
      {fontError && (
        <div className="font-error-banner">
          <span>字体加载失败：{fontError.message}</span>
        </div>
      )}

      <EditorToolbar
        activeTemplate={activeTemplate}
        canUndo={canUndo}
        canRedo={canRedo}
        onSelectTemplate={setActiveTemplate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSelectGrid={() => setSelection({ semanticId: "main.grid", instanceKey: "main.grid:default" })}
      />

      <div className="editor-body">
        <EditorCanvas
          svgDocument={svgDocument}
          scene={scene}
          selection={selection}
          activeTemplate={activeTemplate}
          mainWeekdayHeight={
            activeTemplate === "main"
              ? effectiveDocument.mainTemplate.weekdayRow.height
              : undefined
          }
          onSelect={setSelection}
          onSelectAnchor={handleSelectAnchor}
          onStartDrag={handleStartDrag}
          onMoveDrag={handleMoveDrag}
          onEndDrag={handleEndDrag}
          onCancelDrag={handleCancelDrag}
          onStartWeekdayResize={handleStartWeekdayResize}
          onMoveWeekdayResize={handleMoveWeekdayResize}
          onEndWeekdayResize={handleEndWeekdayResize}
        />

        <Inspector
          document={document}
          selection={selection}
          onCommitDocument={commitDocument}
          onAnchorChange={handleSelectAnchor}
        />
      </div>
    </div>
  );
};
