import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CanvasInspector } from "./CanvasInspector";
import { createDefaultEditorDocument } from "../state/documentStore";

describe("CanvasInspector", () => {
  it("renders dimensions for main template and triggers onChange on width edit", () => {
    const doc = createDefaultEditorDocument();
    const handleCommit = vi.fn();

    render(
      <CanvasInspector
        document={doc}
        activeTemplate="main"
        onCommitDocument={handleCommit}
      />
    );

    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(inputs[0].value).toBe("700");
    expect(inputs[1].value).toBe("500");

    fireEvent.change(inputs[0], { target: { value: "850" } });
    expect(handleCommit).toHaveBeenCalledTimes(1);
    const updatedDoc = handleCommit.mock.calls[0][0];
    expect(updatedDoc.mainTemplate.width).toBe(850);
  });

  it("applies preset when clicked", () => {
    const doc = createDefaultEditorDocument();
    const handleCommit = vi.fn();

    render(
      <CanvasInspector
        document={doc}
        activeTemplate="main"
        onCommitDocument={handleCommit}
      />
    );

    const presetBtn = screen.getByText("800 × 600 (4:3 标准)");
    fireEvent.click(presetBtn);

    expect(handleCommit).toHaveBeenCalledTimes(1);
    const updatedDoc = handleCommit.mock.calls[0][0];
    expect(updatedDoc.mainTemplate.width).toBe(800);
    expect(updatedDoc.mainTemplate.height).toBe(600);
  });

  it("renders dimensions for mini template", () => {
    const doc = createDefaultEditorDocument();
    const handleCommit = vi.fn();

    render(
      <CanvasInspector
        document={doc}
        activeTemplate="mini"
        onCommitDocument={handleCommit}
      />
    );

    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(inputs[0].value).toBe("280");
    expect(inputs[1].value).toBe("210");
  });
});
