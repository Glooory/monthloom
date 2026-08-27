import { describe, it, expect } from "vitest";
import { getDisplayErrorMessage } from "./errorMessage";

describe("getDisplayErrorMessage", () => {
  it("extracts message from standard Error", () => {
    expect(getDisplayErrorMessage(new Error("Database write failed"))).toBe("Database write failed");
  });

  it("handles string errors", () => {
    expect(getDisplayErrorMessage("Invalid JSON format")).toBe("Invalid JSON format");
  });

  it("handles empty or null values with fallback", () => {
    expect(getDisplayErrorMessage(null)).toBe("An unexpected error occurred.");
    expect(getDisplayErrorMessage(undefined)).toBe("An unexpected error occurred.");
    expect(getDisplayErrorMessage("")).toBe("An unexpected error occurred.");
  });

  it("extracts message property from objects", () => {
    expect(getDisplayErrorMessage({ message: "Network timeout" })).toBe("Network timeout");
  });
});
