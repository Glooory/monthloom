import React from "react";
import { useI18n } from "../../shared/i18n/i18nStore";

export interface EditorToolbarProps {
  activeTemplate: "main" | "mini";
  canUndo: boolean;
  canRedo: boolean;
  onSelectTemplate: (template: "main" | "mini") => void;
  onUndo: () => void;
  onRedo: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTemplate,
  canUndo,
  canRedo,
  onSelectTemplate,
  onUndo,
  onRedo,
  zoom = 1,
  onZoomChange,
}) => {
  const { t } = useI18n();

  return (
    <div className="editor-toolbar">
      {/* Template Tab Switcher */}
      <div className="toolbar-group">
        <div className="toolbar-segmented">
          <button
            type="button"
            className={`toolbar-btn ${activeTemplate === "main" ? "active" : ""}`}
            onClick={() => onSelectTemplate("main")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            {t.toolbar.mainTemplate}
          </button>
          <button
            type="button"
            className={`toolbar-btn ${activeTemplate === "mini" ? "active" : ""}`}
            onClick={() => onSelectTemplate("mini")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="5" width="14" height="14" rx="2" />
              <line x1="5" y1="10" x2="19" y2="10" />
            </svg>
            {t.toolbar.miniTemplate}
          </button>
        </div>
      </div>

      {/* Center Zoom Controls */}
      {onZoomChange && (
        <div className="toolbar-group">
          <div className="toolbar-segmented">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
              title={t.toolbar.zoomOut}
            >
              −
            </button>
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "0 6px", color: "var(--text-secondary)" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => onZoomChange(Math.min(2.5, zoom + 0.25))}
              title={t.toolbar.zoomIn}
            >
              +
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => onZoomChange(1)}
              title={t.toolbar.zoomReset}
            >
              {t.toolbar.zoomReset}
            </button>
          </div>
        </div>
      )}

      {/* Undo / Redo */}
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          disabled={!canUndo}
          onClick={onUndo}
          title={t.toolbar.undo}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </svg>
          {t.toolbar.undo.split(" ")[0]}
        </button>
        <button
          type="button"
          className="toolbar-btn"
          disabled={!canRedo}
          onClick={onRedo}
          title={t.toolbar.redo}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
          </svg>
          {t.toolbar.redo.split(" ")[0]}
        </button>
      </div>
    </div>
  );
};

