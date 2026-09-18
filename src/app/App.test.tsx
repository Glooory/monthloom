import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./App";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { useI18nStore } from "../shared/i18n/i18nStore";

describe("App Integration Smoke Test", () => {
  beforeEach(() => {
    localStorage.clear();
    useI18nStore.getState().setLocale("zh");
  });

  it("renders main sections and controls in default Chinese, and supports switching to English", async () => {
    render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );

    // Wait for app hydration to complete
    expect(await screen.findByRole("button", { name: /主日历/i })).toBeDefined();

    // App header
    expect(screen.getByText("Monthloom")).toBeDefined();
    expect(screen.getAllByText(/目标年份/).length).toBeGreaterThan(0);

    // Section: Editor Canvas
    expect(screen.getByRole("button", { name: /附日历/i })).toBeDefined();

    // Section: Page Preview Settings
    expect(screen.getByText("页面版面与背景")).toBeDefined();
    expect(screen.getByText("上传背景图")).toBeDefined();

    // Switch to Workspace Tab
    const workspaceTabBtn = screen.getByRole("button", {
      name: /项目与导出/i,
    });
    expect(workspaceTabBtn).toBeDefined();
    fireEvent.click(workspaceTabBtn);

    // Section 1: Workspace Controls
    expect(screen.getAllByText(/节假日资料库/i).length).toBeGreaterThan(0);

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
    expect(screen.getByText("Save Project")).toBeDefined();
    expect(screen.getByText("Batch Export 28 SVGs")).toBeDefined();

    // Switch back to editor tab in English
    const editorTabBtn = screen.getByRole("button", {
      name: /Template Design/i,
    });
    expect(editorTabBtn).toBeDefined();
    fireEvent.click(editorTabBtn);

    expect(screen.getByRole("button", { name: /Main Calendar/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Mini Calendar/i })).toBeDefined();
    expect(screen.getByText("Page Layout & Background")).toBeDefined();
  });

  it("persists project name and target year from header edits and restores them upon reload", async () => {
    const { getActiveProjectId } = await import("../persistence/session/projectSession");
    const { unmount } = render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );

    // Find header project name and target year inputs once hydrated
    const nameInput = (await screen.findByRole("textbox", { name: /项目名称/i })) as HTMLInputElement;
    const yearInput = (await screen.findByRole("spinbutton", { name: /目标年份/i })) as HTMLInputElement;

    // Edit project name and target year
    fireEvent.change(nameInput, { target: { value: "My 2029 Wall Calendar" } });
    fireEvent.blur(nameInput);

    fireEvent.change(yearInput, { target: { value: "2029" } });
    fireEvent.blur(yearInput);

    // Check active project id in localStorage once flushed to DB
    await waitFor(() => {
      const activeId = getActiveProjectId();
      expect(activeId).toBeTruthy();
      expect(activeId?.startsWith("project-")).toBe(true);
    });

    // Unmount app to simulate page unload
    unmount();

    // Re-mount app to simulate page reload/refresh
    render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );

    // Check that newly rendered header inputs have restored values after hydration
    await waitFor(() => {
      const restoredNameInput = screen.getByRole("textbox", { name: /项目名称/i }) as HTMLInputElement;
      const restoredYearInput = screen.getByRole("spinbutton", { name: /目标年份/i }) as HTMLInputElement;
      expect(restoredNameInput.value).toBe("My 2029 Wall Calendar");
      expect(restoredYearInput.value).toBe("2029");
    });
  });

  it("renders a loading placeholder until project data is ready, preventing premature default values", async () => {
    render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );

    // Initial render displays the loading status indicator
    expect(screen.getByRole("status", { name: "loading-app" })).toBeDefined();

    // After hydration completes, the loading screen is removed and the editor is shown
    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "loading-app" })).toBeNull();
      expect(screen.getByRole("textbox", { name: /项目名称/i })).toBeDefined();
    });
  });
});
