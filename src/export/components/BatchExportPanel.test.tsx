import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchExportPanel } from "./BatchExportPanel";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";
import { useI18nStore } from "../../shared/i18n/i18nStore";

describe("BatchExportPanel", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
    useI18nStore.getState().setLocale("zh");
  });

  it("renders export button with exact copy '批量导出 28 张 SVG' and mode selectors in Chinese and English", () => {
    const { unmount } = render(<BatchExportPanel />);

    expect(screen.getByText("批量导出 28 张 SVG")).toBeDefined();
    expect(screen.getByLabelText(/转曲轮廓/i)).toBeDefined();
    expect(screen.getByLabelText(/保留文本/i)).toBeDefined();
    expect(screen.getByText(/13 个主日历 \+ 15 个附日历/i)).toBeDefined();

    unmount();
    useI18nStore.getState().setLocale("en");
    render(<BatchExportPanel />);

    expect(screen.getByText("Batch Export 28 SVGs")).toBeDefined();
    expect(screen.getByLabelText(/Outlined/i)).toBeDefined();
    expect(screen.getByLabelText(/Editable Text/i)).toBeDefined();
  });
});
