import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchExportPanel } from "./BatchExportPanel";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";

describe("BatchExportPanel", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it("renders export button with exact copy '批量导出 28 张 SVG' and mode selectors", () => {
    render(<BatchExportPanel />);

    expect(screen.getByText("批量导出 28 张 SVG")).toBeDefined();
    expect(screen.getByLabelText(/转曲轮廓/i)).toBeDefined();
    expect(screen.getByLabelText(/可编辑文本/i)).toBeDefined();
    expect(screen.getByText(/13 个主日历 \+ 15 个附日历/i)).toBeDefined();
  });
});
