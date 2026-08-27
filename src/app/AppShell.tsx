import React, { ReactNode } from "react";
import "./app.css";

interface AppShellProps {
  header: ReactNode;
  controls: ReactNode;
  editor: ReactNode;
  pageSettings: ReactNode;
  preview: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  header,
  controls,
  editor,
  pageSettings,
  preview,
}) => {
  return (
    <div className="monthloom-app">
      <header className="monthloom-header">{header}</header>
      <section className="monthloom-controls-grid">{controls}</section>
      <section className="monthloom-section monthloom-editor-section">{editor}</section>
      <section className="monthloom-section monthloom-page-settings-section">{pageSettings}</section>
      <main className="monthloom-preview-main">{preview}</main>
    </div>
  );
};
