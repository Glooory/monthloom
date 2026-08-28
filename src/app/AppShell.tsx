import React, { ReactNode } from "react";
import "./app.css";

export interface AppShellProps {
  header: ReactNode;
  activeView?: "editor" | "gallery" | "workspace";
  controls: ReactNode;
  editor: ReactNode;
  pageSettings: ReactNode;
  preview: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  header,
  activeView = "editor",
  controls,
  editor,
  pageSettings,
  preview,
}) => {
  return (
    <div className="monthloom-app">
      <header className="monthloom-header">{header}</header>
      <main className="monthloom-main-content">
        {/* View 1: Template Editor Studio */}
        <div
          className="monthloom-view-pane"
          style={{
            display: activeView === "editor" ? "flex" : "none",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {editor}
        </div>

        {/* View 2: Full-Year Gallery & Page Settings */}
        <div
          className="monthloom-view-pane"
          style={{
            display: activeView === "gallery" ? "flex" : "none",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {pageSettings}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            {preview}
          </div>
        </div>

        {/* View 3: Workspace, Persistence & Batch Export */}
        <div
          className="monthloom-view-pane"
          style={{
            display: activeView === "workspace" ? "flex" : "none",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            overflowY: "auto",
            padding: "24px",
            background: "var(--bg-canvas)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "20px",
              maxWidth: "1200px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            {controls}
          </div>
        </div>
      </main>
    </div>
  );
};

