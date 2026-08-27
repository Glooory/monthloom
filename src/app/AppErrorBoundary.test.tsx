import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppErrorBoundary } from "./AppErrorBoundary";

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Simulated rendering explosion");
  }
  return <div>Working UI</div>;
};

describe("AppErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </AppErrorBoundary>,
    );
    expect(screen.getByText("Working UI")).toBeDefined();
  });

  it("catches render error and displays friendly fallback UI", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <AppErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("应用运行异常")).toBeDefined();
    expect(screen.getByText("Simulated rendering explosion")).toBeDefined();
    expect(screen.getByText("重新加载应用")).toBeDefined();

    spy.mockRestore();
  });
});
