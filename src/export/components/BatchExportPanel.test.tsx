import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchExportPanel } from "./BatchExportPanel";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";

describe("BatchExportPanel", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it("renders export button with exact copy 'Export 28 SVGs' and mode selectors", () => {
    render(<BatchExportPanel />);

    expect(screen.getByText("Export 28 SVGs")).toBeDefined();
    expect(screen.getByLabelText(/outlined/i)).toBeDefined();
    expect(screen.getByLabelText(/editable/i)).toBeDefined();
    expect(screen.getByText(/13 Main \+ 15 Mini/i)).toBeDefined();
  });
});
