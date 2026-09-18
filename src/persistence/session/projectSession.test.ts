import { describe, it, expect, beforeEach } from "vitest";
import {
  ACTIVE_PROJECT_STORAGE_KEY,
  getActiveProjectId,
  setActiveProjectId,
  clearActiveProjectId,
} from "./projectSession";

describe("projectSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no active project id is stored", () => {
    expect(getActiveProjectId()).toBeNull();
  });

  it("stores and retrieves active project id", () => {
    setActiveProjectId("proj-123");
    expect(localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBe("proj-123");
    expect(getActiveProjectId()).toBe("proj-123");
  });

  it("trims whitespace from active project id", () => {
    setActiveProjectId("  proj-trimmed  ");
    expect(getActiveProjectId()).toBe("proj-trimmed");
  });

  it("returns null when stored id is empty or only whitespace", () => {
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "   ");
    expect(getActiveProjectId()).toBeNull();
  });

  it("clears active project id", () => {
    setActiveProjectId("proj-123");
    expect(getActiveProjectId()).toBe("proj-123");
    clearActiveProjectId();
    expect(getActiveProjectId()).toBeNull();
    expect(localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBeNull();
  });
});
