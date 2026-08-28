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
    expect(inputs[2].value).toBe("1"); // grid border width

    fireEvent.change(inputs[0], { target: { value: "850" } });
    expect(handleCommit).toHaveBeenCalledTimes(1);
    const updatedDoc = handleCommit.mock.calls[0][0];
    expect(updatedDoc.mainTemplate.width).toBe(850);

    // Test border change
    fireEvent.change(inputs[2], { target: { value: "2" } });
    expect(handleCommit).toHaveBeenCalledTimes(2);
    const borderUpdatedDoc = handleCommit.mock.calls[1][0];
    expect(borderUpdatedDoc.mainTemplate.dateGrid.borderWidth).toBe(2);
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

  it("handles weekday row border toggle and edit in main template", () => {
    const doc = createDefaultEditorDocument();
    const handleCommit = vi.fn();

    render(
      <CanvasInspector
        document={doc}
        activeTemplate="main"
        onCommitDocument={handleCommit}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    // 0: Date Grid border (checked by default)
    expect(checkboxes[0].checked).toBe(true);
    // 1: Weekday row border (unchecked by default)
    expect(checkboxes[1].checked).toBe(false);
    // 2: Adjacent Days (unchecked by default, in Section 3)
    expect(checkboxes[2].checked).toBe(false);

    // Toggle weekday border ON
    fireEvent.click(checkboxes[1]);
    expect(handleCommit).toHaveBeenCalledTimes(1);
    const weekdayBorderDoc = handleCommit.mock.calls[0][0];
    expect(weekdayBorderDoc.mainTemplate.weekdayRow.showBorder).toBe(true);

    // Toggle adjacent days ON
    fireEvent.click(checkboxes[2]);
    expect(handleCommit).toHaveBeenCalledTimes(2);
    const adjacentDaysOnDoc = handleCommit.mock.calls[1][0];
    expect(adjacentDaysOnDoc.mainTemplate.showAdjacentDays).toBe(true);

    // Toggle dateGrid border OFF
    fireEvent.click(checkboxes[0]);
    expect(handleCommit).toHaveBeenCalledTimes(3);
    const dateGridOffDoc = handleCommit.mock.calls[2][0];
    expect(dateGridOffDoc.mainTemplate.dateGrid.showBorder).toBe(false);
  });

  it("renders dimensions and weekday border for mini template", () => {
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
    expect(inputs.length).toBe(2);
    expect(inputs[0].value).toBe("280");
    expect(inputs[1].value).toBe("210");

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(handleCommit).toHaveBeenCalledTimes(1);
    const updatedDoc = handleCommit.mock.calls[0][0];
    expect(updatedDoc.miniTemplate.weekdayRow.showBorder).toBe(true);
  });
});


