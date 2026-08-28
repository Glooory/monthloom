import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "./App";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { useI18nStore } from "../shared/i18n/i18nStore";

describe("App Integration Smoke Test", () => {
  beforeEach(() => {
    localStorage.clear();
    useI18nStore.getState().setLocale("zh");
  });

  it("renders main sections and controls in default Chinese, and supports switching to English", () => {
    render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );

    // App header
    expect(screen.getByText("Monthloom")).toBeDefined();
    expect(screen.getAllByText(/目标年份/).length).toBeGreaterThan(0);

    // Section: Editor Canvas
    expect(screen.getByRole("button", { name: /主日历/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /附日历/i })).toBeDefined();

    // Section: Page Preview Settings
    expect(screen.getByText("页面版面与背景")).toBeDefined();
    expect(screen.getByText("上传背景图")).toBeDefined();

    // Switch to Workspace Tab
    const workspaceTabBtn = screen.getByRole("button", { name: /项目与导出/i });
    expect(workspaceTabBtn).toBeDefined();
    fireEvent.click(workspaceTabBtn);

    // Section 1: Workspace Controls
    expect(screen.getByText("法定节假日数据")).toBeDefined();
    expect(screen.getByText("导入中国节假日 (JSON)")).toBeDefined();
    expect(screen.getByText("导入日本节假日 (JSON)")).toBeDefined();

    // Section 2: Persistence Controls
    expect(screen.getByText("项目与模板")).toBeDefined();
    expect(screen.getByText("保存项目")).toBeDefined();
    expect(screen.getByText("导出项目包 (.monthloom)")).toBeDefined();
    expect(screen.getByText("导入项目包 (.monthloom)")).toBeDefined();

    // Section 3: Batch Export
    expect(screen.getByText("正式批量导出 SVG")).toBeDefined();
    expect(screen.getByText("批量导出 28 张 SVG")).toBeDefined();

    // Language switcher toggle
    const langBtn = screen.getByTestId("language-toggle-btn");
    expect(langBtn).toBeDefined();
    fireEvent.click(langBtn);

    // Should switch to English
    expect(screen.getByText("Holiday Datasets")).toBeDefined();
    expect(screen.getByText("Save Project")).toBeDefined();
    expect(screen.getByText("Batch Export 28 SVGs")).toBeDefined();

    // Switch back to editor tab in English
    const editorTabBtn = screen.getByRole("button", { name: /Template Design/i });
    expect(editorTabBtn).toBeDefined();
    fireEvent.click(editorTabBtn);

    expect(screen.getByRole("button", { name: /Main Calendar/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Mini Calendar/i })).toBeDefined();
    expect(screen.getByText("Page Layout & Background")).toBeDefined();
  });
});
