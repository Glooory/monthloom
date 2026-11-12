import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./App";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { useI18nStore } from "../shared/i18n/i18nStore";
import { useDocumentStore } from "../editor/state/documentStore";
import { projectOperations } from "../persistence/operations/projectOperations";
import { db } from "../persistence/db/monthloomDb";
import { useWorkspaceStore } from "../workspace/state/workspaceStore";
import * as bundleExport from "../persistence/bundle/exportBundle";

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
    expect(screen.getByText("页面布局与背景")).toBeDefined();
    expect(screen.getByText("上传背景图")).toBeDefined();

    // Switch to Workspace Tab
    const workspaceTabBtn = screen.getByRole("button", {
      name: /项目与导出/i,
    });
    expect(workspaceTabBtn).toBeDefined();
    fireEvent.click(workspaceTabBtn);

    // Section 1: Workspace Controls
    expect(screen.getAllByText(/节假日库/i).length).toBeGreaterThan(0);

    // Section 2: Persistence Controls
    expect(screen.getByText("项目与模板")).toBeDefined();
    expect(screen.getByText("保存项目")).toBeDefined();
    expect(screen.getByText("导出项目包 (.monthloom)")).toBeDefined();
    expect(screen.getByText("导入项目包 (.monthloom)")).toBeDefined();

    // Section 3: Batch Export
    expect(screen.getAllByText("导出 SVG")[0]).toBeDefined();
    expect(screen.getByText("导出 28 个 SVG")).toBeDefined();

    // Language switcher toggle
    const langBtn = screen.getByTestId("language-toggle-btn");
    expect(langBtn).toBeDefined();
    fireEvent.click(langBtn);

    // Should switch to English
    expect(screen.getByText("Save Project")).toBeDefined();
    expect(screen.getByText("Export 28 SVGs")).toBeDefined();

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
    expect(screen.getByRole("status", { name: "正在加载项目…" })).toBeDefined();

    // After hydration completes, the loading screen is removed and the editor is shown
    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "正在加载项目…" })).toBeNull();
      expect(screen.getByRole("textbox", { name: /项目名称/i })).toBeDefined();
    });
  });

  it("auto-saves document edits, undo and redo, and restores the edits on reload", async () => {
    const app = render(<App />);
    await screen.findByRole("textbox", { name: /项目名称/i });
    const original = useDocumentStore.getState().document;
    const edited = {
      ...original,
      mainTemplate: { ...original.mainTemplate, width: original.mainTemplate.width + 20 },
      miniTemplate: { ...original.miniTemplate, width: original.miniTemplate.width + 10 },
      holidayLayers: original.holidayLayers.map((layer, index) => index === 0 ? {
        ...layer,
        main: { ...layer.main, name: {
          ...layer.main.name,
          position: { ...layer.main.name.position, offsetX: layer.main.name.position.offsetX + 37 },
        } },
      } : layer),
      pagePreview: { ...original.pagePreview, layout: {
        ...original.pagePreview.layout, miniGap: original.pagePreview.layout.miniGap + 5,
      } },
    };
    const expectSaved = async (document: typeof original) => {
      await waitFor(async () => {
        const id = useWorkspaceStore.getState().currentProjectId!;
        expect((await db.projects.get(id))?.document).toEqual(document);
      });
    };

    act(() => useDocumentStore.getState().commitDocument(edited));
    await expectSaved(edited);
    act(() => useDocumentStore.temporal.getState().undo());
    await expectSaved(original);
    act(() => useDocumentStore.temporal.getState().redo());
    await expectSaved(edited);

    app.unmount();
    render(<App />);
    await screen.findByRole("textbox", { name: /项目名称/i });
    expect(useDocumentStore.getState().document).toEqual(edited);
    projectOperations.cancelAutoSave();
  });

  it("exports the latest project edits before the auto-save delay expires", async () => {
    render(<App />);
    await screen.findByRole("textbox", { name: /项目名称/i });
    fireEvent.click(screen.getByRole("button", { name: /项目与导出/i }));
    // Stop after capturing the outgoing snapshot; no browser download is needed.
    const exportSpy = vi.spyOn(bundleExport, "createMonthloomBundle")
      .mockRejectedValueOnce(new Error("Snapshot captured"));
    try {
      const document = useDocumentStore.getState().document;
      const edited = { ...document, mainTemplate: { ...document.mainTemplate, width: document.mainTemplate.width + 1 } };
      act(() => useDocumentStore.getState().commitDocument(edited));
      fireEvent.click(screen.getByRole("button", { name: /导出项目包/i }));
      await waitFor(() => expect(exportSpy).toHaveBeenCalled());
      expect(exportSpy.mock.calls[0][0].snapshot.document).toEqual(edited);
    } finally {
      exportSpy.mockRestore();
      await act(async () => { await projectOperations.flushAutoSave(); });
    }
  });
});
