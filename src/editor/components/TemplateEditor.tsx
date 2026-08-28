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

  const [zoom, setZoom] = useState(1);

  const mainLayers: Array<{ id: PositionableSemanticId | "main.grid"; label: string; key: string }> = [
    { id: "main.date", label: "主日期文本", key: "main.date:default" },
    { id: "main.weekday", label: "星期表头", key: "main.weekday:default" },
    { id: "main.chinaHolidayName", label: "中国节假日名", key: "main.chinaHolidayName:default" },
    { id: "main.japanHolidayName", label: "日本节假日名", key: "main.japanHolidayName:default" },
    { id: "main.chinaHolidayMarker", label: "休假角标 (休)", key: "main.chinaHolidayMarker:default" },
    { id: "main.chinaWorkdayMarker", label: "班期角标 (班)", key: "main.chinaWorkdayMarker:default" },
    { id: "main.grid", label: "网格边框", key: "main.grid:default" },
  ];

  const miniLayers: Array<{ id: PositionableSemanticId; label: string; key: string }> = [
    { id: "mini.monthLabel", label: "月份标题", key: "mini.monthLabel:default" },
    { id: "mini.weekday", label: "星期表头", key: "mini.weekday:default" },
    { id: "mini.date", label: "附日历日期", key: "mini.date:default" },
    { id: "mini.holidayDot", label: "休假圆点", key: "mini.holidayDot:default" },
    { id: "mini.workdayDot", label: "班期圆点", key: "mini.workdayDot:default" },
  ];

  const currentLayers = activeTemplate === "main" ? mainLayers : miniLayers;

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
        zoom={zoom}
        onZoomChange={setZoom}
      />

      <div className="editor-body">
        {/* Left Layers / Elements Sidebar */}
        <div className="editor-layers-sidebar">
          <div className="layers-header">
            <span>图层元素</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              {activeTemplate === "main" ? "主模板" : "附模板"}
            </span>
          </div>
          <div className="layers-list">
            {currentLayers.map((layer) => {
              const isSelected = selection?.semanticId === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  className={`layer-item ${isSelected ? "active" : ""}`}
                  onClick={() => setSelection({ semanticId: layer.id, instanceKey: layer.key })}
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
                    {layer.id.includes("Holiday") && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
                    {layer.id.includes("Marker") && <rect x="3" y="3" width="18" height="18" rx="2" />}
                    {layer.id.includes("Dot") && <circle cx="12" cy="12" r="7" />}
                    {layer.id.includes("grid") && <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />}
                    {layer.id.includes("monthLabel") && <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />}
                  </svg>
                  <span>{layer.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Canvas */}
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
          zoom={zoom}
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

        {/* Right Inspector */}
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
