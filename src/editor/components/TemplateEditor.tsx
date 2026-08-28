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
import { calculatePositionForAnchorChange } from "../interaction/anchorChange";
import { matchUndoRedoShortcut, shouldIgnoreKeyboardShortcut } from "../interaction/keyboardShortcuts";
import { setElementPosition } from "../model/templateBindings";
import { buildEditorHitTargets } from "../selection/hitTargets";
import { resolveSelectedTarget } from "../selection/selection";
import { EditorToolbar } from "./EditorToolbar";
import { EditorCanvas } from "./EditorCanvas";
import { Inspector } from "./Inspector";
import { HolidayLayerTree } from "./HolidayLayerTree";
import { useHolidayLibraryStore } from "../../workspace/state/holidayLibraryStore";
import { useI18n } from "../../shared/i18n/i18nStore";
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
  const { t } = useI18n();
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
    setActiveTemplate,
    setSelection,
    clearSelection,
    setDrag,
  } = useUiStore();

  const [svgDocument, setSvgDocument] = useState<SvgDocument | null>(null);

  // Derive transient effective document
  const effectiveDocument = useMemo(() => {
    return createEffectiveDocument({
      document,
      drag,
      weekdayResize: null,
    });
  }, [document, drag]);

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
        holidayLayers: effectiveDocument.holidayLayers,
      });
    } else {
      return layoutMini({
        calendar,
        template: effectiveDocument.miniTemplate,
        textMeasurer: fontEngine,
        weekdays,
        holidayLayers: effectiveDocument.holidayLayers,
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
    temporal.getState().undo();
  };

  const handleRedo = () => {
    setDrag(null);
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
        if (dragStartRef.current || drag) {
          handleCancelDrag();
        } else if (!shouldIgnoreKeyboardShortcut(e.target)) {
          clearSelection();
        }
      } else if ((e.metaKey || e.ctrlKey) && !shouldIgnoreKeyboardShortcut(e.target)) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((z) => Math.min(4.0, Math.round((z + 0.25) * 100) / 100));
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          setZoom((z) => Math.max(0.25, Math.round((z - 0.25) * 100) / 100));
        } else if (e.key === "0") {
          e.preventDefault();
          setZoom(1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canUndo, canRedo, drag, clearSelection]);

  const [zoom, setZoom] = useState(1);

  const mainLayers: Array<{ id: PositionableSemanticId | "main.grid"; label: string; key: string }> = [
    { id: "main.weekday", label: t.layers.mainWeekday, key: "main.weekday:default" },
    { id: "main.date", label: t.layers.mainDate, key: "main.date:default" },
    { id: "main.grid", label: t.layers.mainGrid, key: "main.grid:default" },
  ];

  const miniLayers: Array<{ id: PositionableSemanticId; label: string; key: string }> = [
    { id: "mini.monthLabel", label: t.layers.miniMonthLabel, key: "mini.monthLabel:default" },
    { id: "mini.weekday", label: t.layers.miniWeekday, key: "mini.weekday:default" },
    { id: "mini.date", label: t.layers.miniDate, key: "mini.date:default" },
  ];

  const currentLayers = activeTemplate === "main" ? mainLayers : miniLayers;
  const holidayCalendars = useHolidayLibraryStore((s) => s.snapshot.calendars);

  return (
    <div className="monthloom-editor">
      {fontError && (
        <div className="font-error-banner">
          <span>{t.errors.fontLoadError(fontError.message)}</span>
        </div>
      )}

      <EditorToolbar
        activeTemplate={activeTemplate}
        canUndo={canUndo}
        canRedo={canRedo}
        onSelectTemplate={setActiveTemplate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      <div className="editor-body">
        {/* Left Layers / Elements Sidebar */}
        <div
          className="editor-layers-sidebar"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelection(null);
            }
          }}
        >
          <div className="layers-header">
            <span>{t.layers.title}</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              {activeTemplate === "main" ? t.layers.mainBadge : t.layers.miniBadge}
            </span>
          </div>
          <div
            className="layers-list"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) {
                setSelection(null);
              }
            }}
          >
            {/* Canvas Root Item */}
            <button
              type="button"
              className={`layer-item ${selection === null ? "active" : ""}`}
              onClick={() => setSelection(null)}
            >
              <svg
                className="layer-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <span>{t.layers.canvasRoot}</span>
            </button>

            {currentLayers.map((layer) => {
              const isSelected = selection?.semanticId === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  className={`layer-item ${isSelected ? "active" : ""}`}
                  onClick={() => setSelection({ semanticId: layer.id as any, instanceKey: layer.key })}
                >
                  <svg
                    className="layer-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {layer.id.includes("date") && <path d="M4 7V4h16v3M9 20h6M12 4v16" />}
                    {layer.id.includes("weekday") && <path d="M3 6h18M3 12h18M3 18h18" />}
                    {layer.id.includes("grid") && <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />}
                    {layer.id.includes("monthLabel") && <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />}
                  </svg>
                  <span>{layer.label}</span>
                </button>
              );
            })}

            <HolidayLayerTree
              document={document}
              activeTemplate={activeTemplate}
              selection={selection}
              calendars={holidayCalendars}
              onSelect={setSelection}
              onCommitDocument={commitDocument}
            />
          </div>
        </div>

        {/* Center Canvas */}
        <EditorCanvas
          svgDocument={svgDocument}
          scene={scene}
          selection={selection}
          activeTemplate={activeTemplate}
          zoom={zoom}
          onZoomChange={setZoom}
          onSelect={setSelection}
          onSelectAnchor={handleSelectAnchor}
          onStartDrag={handleStartDrag}
          onMoveDrag={handleMoveDrag}
          onEndDrag={handleEndDrag}
          onCancelDrag={handleCancelDrag}
        />

        {/* Right Inspector */}
        <Inspector
          document={document}
          selection={selection}
          activeTemplate={activeTemplate}
          onCommitDocument={commitDocument}
          onAnchorChange={handleSelectAnchor}
        />
      </div>
    </div>
  );
};
