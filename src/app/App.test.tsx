import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";
import { AppErrorBoundary } from "./AppErrorBoundary";

describe("App Integration Smoke Test", () => {
  it("renders main sections and controls without crashing", () => {
    render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );

    // App header
    expect(screen.getByText("Monthloom")).toBeDefined();
    expect(screen.getAllByText(/Target Year:/).length).toBeGreaterThan(0);

    // Section 1: Workspace Controls
    expect(screen.getByText("Holiday Datasets")).toBeDefined();
    expect(screen.getByText("Import China JSON")).toBeDefined();
    expect(screen.getByText("Import Japan JSON")).toBeDefined();

    // Section 2: Persistence Controls
    expect(screen.getByText("Projects & Templates")).toBeDefined();
    expect(screen.getByText("Save Project")).toBeDefined();
    expect(screen.getByText("Export .monthloom")).toBeDefined();
    expect(screen.getByText("Import .monthloom")).toBeDefined();

    // Section 3: Batch Export
    expect(screen.getByText("Formal Batch SVG Export")).toBeDefined();
    expect(screen.getByText("Export 28 SVGs")).toBeDefined();

    // Section 4: Editor Canvas
    expect(screen.getByRole("button", { name: "Main Template" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Mini Template" })).toBeDefined();

    // Section 5: Page Preview Settings
    expect(screen.getByText("Page Preview Layout Settings")).toBeDefined();
    expect(screen.getByText("Upload Background")).toBeDefined();
  });
});
