import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkspaceControls } from "./WorkspaceControls";
import { useWorkspaceStore } from "../state/workspaceStore";

describe("WorkspaceControls", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it("renders project name, target year, and import controls", () => {
    render(<WorkspaceControls />);
    const nameInput = screen.getByLabelText("Project Name") as HTMLInputElement;
    const yearInput = screen.getByLabelText(/target year/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Untitled Project");
    expect(yearInput.value).toBe("2027");
    expect(screen.getByText("Import China JSON")).toBeDefined();
    expect(screen.getByText("Import Japan JSON")).toBeDefined();
  });

  it("updates target year via input", () => {
    render(<WorkspaceControls />);
    const yearInput = screen.getByLabelText(/target year/i) as HTMLInputElement;
    fireEvent.change(yearInput, { target: { value: "2028" } });
    expect(useWorkspaceStore.getState().targetYear).toBe(2028);
  });
});
