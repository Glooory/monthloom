import React from "react";

export interface EditorToolbarProps {
  activeTemplate: "main" | "mini";
  canUndo: boolean;
  canRedo: boolean;
  onSelectTemplate: (template: "main" | "mini") => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectGrid?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTemplate,
  canUndo,
  canRedo,
  onSelectTemplate,
  onUndo,
  onRedo,
  onSelectGrid,
}) => {
  return (
    <div className="editor-toolbar">
      {/* Template Tab Switcher */}
      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn ${activeTemplate === "main" ? "active" : ""}`}
          onClick={() => onSelectTemplate("main")}
        >
          Main Template
        </button>
        <button
          type="button"
          className={`toolbar-btn ${activeTemplate === "mini" ? "active" : ""}`}
          onClick={() => onSelectTemplate("mini")}
        >
          Mini Template
        </button>

        {activeTemplate === "main" && onSelectGrid && (
          <button
            type="button"
            className="toolbar-btn"
            onClick={onSelectGrid}
            title="Inspect Date Grid Border"
          >
            Grid Border
          </button>
        )}
      </div>

      {/* Undo / Redo */}
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Cmd/Ctrl + Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </svg>
          Undo
        </button>
        <button
          type="button"
          className="toolbar-btn"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Cmd/Ctrl + Shift + Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
          </svg>
          Redo
        </button>
      </div>
    </div>
  );
};
