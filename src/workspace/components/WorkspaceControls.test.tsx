import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkspaceControls } from "./WorkspaceControls";
import { useWorkspaceStore } from "../state/workspaceStore";

describe("WorkspaceControls", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it("renders project name, target year, and holiday library button", () => {
    render(<WorkspaceControls />);
    const nameInput = screen.getByLabelText("项目名称") as HTMLInputElement;
    const yearInput = screen.getByLabelText(/目标年份/i) as HTMLInputElement;
    expect(nameInput.value).toBe("未命名项目");
    expect(yearInput.value).toBe("2027");
    expect(screen.getByText(/节假日资料库/i)).toBeDefined();
  });

  it("updates target year via input", () => {
    render(<WorkspaceControls />);
    const yearInput = screen.getByLabelText(/目标年份/i) as HTMLInputElement;
    fireEvent.change(yearInput, { target: { value: "2028" } });
    expect(useWorkspaceStore.getState().targetYear).toBe(2028);
  });
});
