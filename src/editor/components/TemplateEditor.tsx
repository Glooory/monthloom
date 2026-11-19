import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { BinaryAssetResolver, BinaryAssetWriter } from "../../resources/assets/types";
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
import { usePreviewResource } from "../../shared/react/usePreviewResource";
import { PreviewStatusBanner } from "../../shared/react/PreviewStatusBanner";
import { PanelDivider, usePanelWidth } from "../../shared/react/PanelDivider";
import { FontSelectionContext, usePreparedFontSelection } from "../fonts/FontSelectionContext";
import "./editor.css";

export interface TemplateEditorProps {
  calendar: CalendarMonth;
  pagePreview?: React.ReactNode;
  targetYear?: number;
  weekdays?: readonly string[];
  fetchImpl?: typeof fetch;
  assetResolver?: BinaryAssetResolver;
}

const MIN_LAYERS_WIDTH = 150;
const MIN_INSPECTOR_WIDTH = 248;
const EDITOR_DIVIDERS_WIDTH = 16;

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  calendar,
  pagePreview,
  targetYear = calendar.year,
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

  const miniEnabled = document.pagePreview.layout.miniEnabled;
  const editorEnabled = activeTemplate === "main" || miniEnabled;

  const fontSelection = usePreparedFontSelection({ targetYear, assetResolver, fetchImpl });

  // Derive transient effective document
  const effectiveDocument = useMemo(() => {
    return createEffectiveDocument({
      document,
      drag,
      weekdayResize: null,
    });
  }, [document, drag]);

  // Load font engine with requirement stability
  const { fontEngine, issues = [], loading: fontLoading, error: fontError, retry: retryFonts } = useEditorFontEngine({
    calendar,
    targetYear,
    activeTemplate,
    weekdays,
    document: effectiveDocument,
    enabled: editorEnabled,
    assetResolver,
    fetchImpl,
  });

  const renderKey = useMemo(() => ({ fontEngine, activeTemplate, calendar, effectiveDocument, weekdays, assetResolver }),
    [fontEngine, activeTemplate, calendar, effectiveDocument, weekdays, assetResolver]);
  const preview = usePreviewResource({
    resourceKey: renderKey,
    load: async () => {
      if (!editorEnabled || !fontEngine) return null;
      const scene = activeTemplate === "main"
        ? layoutMain({ calendar, template: effectiveDocument.mainTemplate, textMeasurer: fontEngine, weekdays, holidayLayers: effectiveDocument.holidayLayers })
        : layoutMini({ calendar, template: effectiveDocument.miniTemplate, textMeasurer: fontEngine, weekdays, holidayLayers: effectiveDocument.holidayLayers });
      const svg = await materializeSvg({ scene, mode: "outlined", fontEngine, assetResolver });
      return { scene, fontEngine, document: svg, activeTemplate, year: calendar.year, month: calendar.month };
    },
  });
  // Preserve complete previews per view rather than one shared main/mini slot.
  const previews = useRef(new Map<string, NonNullable<typeof preview.value>>());
  const viewKey = `${activeTemplate}:${calendar.year}-${calendar.month}`;
  if (preview.value) {
    const value = preview.value;
    previews.current.set(`${value.activeTemplate}:${value.year}-${value.month}`, value);
    if (previews.current.size > 32) previews.current.delete(previews.current.keys().next().value!);
  }
  const displayedPreview = previews.current.get(viewKey);
  const svgDocument = displayedPreview?.document ?? null;
  const scene = displayedPreview?.scene ?? null;
  const canvasScene = scene;
  // Layout-only updates (including drag frames) must retain pointer capture.
  const previewPending = fontLoading || !fontEngine || displayedPreview?.fontEngine !== fontEngine || !!preview.error;
  const previewError = fontError ?? preview.error;

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
      } else if (editorEnabled && (e.metaKey || e.ctrlKey) && !shouldIgnoreKeyboardShortcut(e.target)) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((z) => Math.min(4.0, Math.round((z + 0.1) * 100) / 100));
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 100) / 100));
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
  }, [canUndo, canRedo, drag, clearSelection, editorEnabled]);

  const [zoom, setZoom] = useState(1);
  const [showPagePreview, setShowPagePreview] = useState(
    () => new URLSearchParams(window.location.search).get("pagePreview") === "true",
  );
  useEffect(() => {
    const handlePopState = () => {
      setShowPagePreview(new URLSearchParams(window.location.search).get("pagePreview") === "true");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const togglePagePreview = () => {
    const shown = !showPagePreview;
    const url = new URL(window.location.href);
    url.searchParams.set("pagePreview", String(shown));
    window.history.pushState(window.history.state, "", url);
    setShowPagePreview(shown);
  };
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const body = editorBodyRef.current;
    if (!body) return;
    const measure = () => {
      if (body.clientWidth > 0) setEditorWidth(body.clientWidth);
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  // Give each sidebar a share of the spare width so dragging one never pushes the other.
  const canvasReserve = Math.min(240, editorWidth * 0.22);
  const spareWidth = Math.max(0, editorWidth - canvasReserve - EDITOR_DIVIDERS_WIDTH - MIN_LAYERS_WIDTH - MIN_INSPECTOR_WIDTH);
  const layersPanel = usePanelWidth({
    storageKey: "monthloom_layers_width",
    defaultWidth: 220,
    minWidth: MIN_LAYERS_WIDTH,
    maxWidth: 360,
    availableWidth: MIN_LAYERS_WIDTH + Math.floor(spareWidth * 0.4),
  });
  const inspectorPanel = usePanelWidth({
    storageKey: "monthloom_inspector_width",
    defaultWidth: 320,
    minWidth: MIN_INSPECTOR_WIDTH,
    maxWidth: 480,
    availableWidth: MIN_INSPECTOR_WIDTH + Math.floor(spareWidth * 0.6),
  });
  const pagePreviewPanel = usePanelWidth({
    storageKey: "monthloom_page_preview_width",
    defaultWidth: 38,
    minWidth: 20,
    maxWidth: 70,
  });

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
    <FontSelectionContext.Provider value={fontSelection}>
    <div className="monthloom-editor">
      {editorEnabled && fontSelection.job && (
        <div className="font-error-banner" role={fontSelection.error ? "alert" : "status"}>
          <div className="font-error-message">
            <span>{fontSelection.coverageError
              ? t.errors.fontIncompatible(fontSelection.coverageError.family, fontSelection.coverageError.characters)
              : fontSelection.error ? t.errors.fontSelectionFailed(fontSelection.job.descriptor.family)
              : t.errors.fontSelectionPending(fontSelection.job.descriptor.family)}</span>
            {fontSelection.error && !fontSelection.coverageError && <span>{t.errors.fontLoadError(fontSelection.error.message)}</span>}
          </div>
          <div className="font-error-actions">
            {!fontSelection.coverageError && <button type="button" className="studio-btn studio-btn-secondary" disabled={fontSelection.loading} onClick={fontSelection.retry}>
              {fontSelection.loading ? t.errors.fontRetrying : t.errors.fontRetry}
            </button>}
            <button type="button" className="studio-btn studio-btn-secondary" onClick={fontSelection.cancel}>{t.errors.cancelFontSelection}</button>
          </div>
        </div>
      )}
      {editorEnabled && <PreviewStatusBanner error={previewError} issues={issues} loading={fontLoading || (preview.loading && displayedPreview?.fontEngine !== fontEngine)}
        retained={!!svgDocument} retry={() => { retryFonts(); preview.retry(); }} />}

      <EditorToolbar
        showPagePreview={showPagePreview}
        onTogglePagePreview={editorEnabled && pagePreview ? togglePagePreview : undefined}
        activeTemplate={activeTemplate}
        canUndo={canUndo}
        canRedo={canRedo}
        onSelectTemplate={setActiveTemplate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={editorEnabled ? setZoom : undefined}
      />

      <div
        className="editor-body"
        ref={editorBodyRef}
        style={{ "--editor-inspector-width": `${inspectorPanel.width}px` } as React.CSSProperties}
      >
        {/* Left Layers / Elements Sidebar */}
        <div
          className="editor-layers-sidebar"
          style={{ width: layersPanel.width }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelection(null);
            }
          }}
        >
          {activeTemplate === "mini" && (
            <label className="editor-mini-toggle">
              <input
                type="checkbox"
                role="switch"
                checked={miniEnabled}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  commitDocument({
                    ...document,
                    pagePreview: {
                      ...document.pagePreview,
                      layout: { ...document.pagePreview.layout, miniEnabled: enabled },
                    },
                  });
                  if (!enabled) {
                    clearSelection();
                    useUiStore.getState().setPageSelection(null);
                  }
                }}
              />
              {t.toolbar.enableMiniCalendars}
            </label>
          )}
          {editorEnabled && (
            <>
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
            </>
          )}
        </div>

        {editorEnabled && (
          <>
            <PanelDivider {...layersPanel} label={t.toolbar.resizeLayers} side="left" />
            {/* Center canvas and optional full-page preview */}
            <div className="editor-canvas-area">
              <EditorCanvas
                svgDocument={svgDocument}
                scene={canvasScene}
                interactive={!previewPending}
                emptyMessage={previewError ? t.errors.fontPreviewUnavailable : undefined}
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

              {showPagePreview && pagePreview && (
                <>
                  <PanelDivider {...pagePreviewPanel} label={t.toolbar.resizePagePreview} side="right" percentage />
                  <aside className="editor-page-preview" aria-label={t.toolbar.pagePreview}
                    style={{ flexBasis: `${pagePreviewPanel.width}%` }}>
                    <div className="editor-page-preview-title">{t.toolbar.pagePreview}</div>
                    {pagePreview}
                  </aside>
                </>
              )}
            </div>
            <PanelDivider {...inspectorPanel} label={t.toolbar.resizeInspector} side="right" />
            {/* Right Inspector */}
            <Inspector
              key={selection?.semanticId ?? "canvas"}
              document={document}
              selection={selection}
              activeTemplate={activeTemplate}
              onCommitDocument={commitDocument}
              getCurrentDocument={() => useDocumentStore.getState().document}
              onAnchorChange={handleSelectAnchor}
              fontAssetStore={"setAsset" in assetResolver ? assetResolver as BinaryAssetResolver & BinaryAssetWriter : undefined}
            />
          </>
        )}
      </div>
    </div>
    </FontSelectionContext.Provider>
  );
};
