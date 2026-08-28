import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NumberInput } from "./NumberInput";

describe("NumberInput", () => {
  it("renders with initial value and updates when prop changes", () => {
    const handleChange = vi.fn();
    const { rerender } = render(<NumberInput value={50} onChange={handleChange} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("50");

    rerender(<NumberInput value={60} onChange={handleChange} />);
    expect(input.value).toBe("60");
  });

  it("allows clearing input and commits previous value on blur if empty", () => {
    const handleChange = vi.fn();
    render(<NumberInput value={50} onChange={handleChange} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    
    // User deletes everything
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");

    // On blur, restores valid value without firing invalid onChange
    fireEvent.blur(input);
    expect(input.value).toBe("50");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("calls onChange immediately for valid values within bounds", () => {
    const handleChange = vi.fn();
    render(<NumberInput value={50} min={10} max={100} onChange={handleChange} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "75" } });
    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it("clamps to min and max on blur", () => {
    const handleChange = vi.fn();
    render(<NumberInput value={50} min={10} max={100} onChange={handleChange} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);
    expect(handleChange).toHaveBeenCalledWith(10);
    expect(input.value).toBe("10");

    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.blur(input);
    expect(handleChange).toHaveBeenCalledWith(100);
    expect(input.value).toBe("100");
  });

  it("rounds to integer when isInteger is true", () => {
    const handleChange = vi.fn();
    render(<NumberInput value={50} isInteger onChange={handleChange} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "50.8" } });
    expect(handleChange).toHaveBeenCalledWith(51);
  });

  it("reverts on Escape key", () => {
    const handleChange = vi.fn();
    render(<NumberInput value={50} onChange={handleChange} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.value).toBe("50");
  });

  it("increments and decrements with ArrowUp and ArrowDown keys (including Shift 10x multiplier)", () => {
    const handleChange = vi.fn();
    render(<NumberInput value={50} step={1} onChange={handleChange} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    
    // ArrowUp increments by 1
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(handleChange).toHaveBeenCalledWith(51);
    expect(input.value).toBe("51");

    // ArrowDown decrements by 1
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(handleChange).toHaveBeenCalledWith(50);
    expect(input.value).toBe("50");

    // Shift + ArrowUp increments by 10
    fireEvent.keyDown(input, { key: "ArrowUp", shiftKey: true });
    expect(handleChange).toHaveBeenCalledWith(60);
    expect(input.value).toBe("60");
  });
});
