import { describe, it, expect, beforeEach } from "vitest";
import { useWorkspaceStore } from "./workspaceStore";

describe("workspaceStore", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it("initializes with default year 2027 and 未命名项目", () => {
    const state = useWorkspaceStore.getState();
    expect(state.targetYear).toBe(2027);
    expect(state.projectName).toBe("未命名项目");
    expect(state.currentProjectId).toBeNull();
  });

  it("updates target year", () => {
    useWorkspaceStore.getState().setTargetYear(2028);
    expect(useWorkspaceStore.getState().targetYear).toBe(2028);
  });

  it("updates project info", () => {
    useWorkspaceStore.getState().setProjectInfo("proj-1", "My Calendar");
    expect(useWorkspaceStore.getState().currentProjectId).toBe("proj-1");
    expect(useWorkspaceStore.getState().projectName).toBe("My Calendar");
  });
});
