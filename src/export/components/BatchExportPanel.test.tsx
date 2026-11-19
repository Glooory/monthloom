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

  it("renders the export options and ZIP button in Chinese and English", () => {
    const { unmount } = render(<BatchExportPanel />);

    expect(screen.getByRole("button", { name: "导出 ZIP" })).toBeDefined();
    expect(screen.getByLabelText(/文字转曲/i)).toBeDefined();
    expect(screen.getByLabelText(/保留文字/i)).toBeDefined();
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    expect(screen.getByRole("checkbox", { name: "主日历（13 个 SVG）", checked: true })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "附日历（15 个 SVG）", checked: true })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "整页排版（13 个 SVG，无背景图）", checked: true })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "整页预览（13 个 PNG，含背景图）", checked: true })).toBeDefined();

    unmount();
    useI18nStore.getState().setLocale("en");
    render(<BatchExportPanel />);

    expect(screen.getByRole("button", { name: "Export ZIP" })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Main calendars (13 SVGs)", checked: true })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Mini calendars (15 SVGs)", checked: true })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Full-page layouts (13 SVGs, no backgrounds)", checked: true })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Full-page previews (13 PNGs, with backgrounds)", checked: true })).toBeDefined();
    expect(screen.getByLabelText(/Outlined/i)).toBeDefined();
    expect(screen.getByLabelText(/Editable Text/i)).toBeDefined();
  });
});
