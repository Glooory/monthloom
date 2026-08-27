import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";
import { AppErrorBoundary } from "./AppErrorBoundary";

describe("App Integration Smoke Test", () => {
  it("renders main sections and controls without crashing", () => {
    render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );

    // App header
    expect(screen.getByText("Monthloom")).toBeDefined();
    expect(screen.getAllByText(/目标年份：/).length).toBeGreaterThan(0);

    // Section 1: Workspace Controls
    expect(screen.getByText("节假日数据")).toBeDefined();
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

    // Section 4: Editor Canvas
    expect(screen.getByRole("button", { name: "主日历模板" })).toBeDefined();
    expect(screen.getByRole("button", { name: "附日历模板" })).toBeDefined();

    // Section 5: Page Preview Settings
    expect(screen.getByText("页面版面与背景设置")).toBeDefined();
    expect(screen.getByText("上传背景图")).toBeDefined();
  });
});
