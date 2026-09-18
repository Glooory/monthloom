export const ACTIVE_PROJECT_STORAGE_KEY = "monthloom_active_project_id";

export function getActiveProjectId(): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const val = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
      return val && val.trim().length > 0 ? val.trim() : null;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

export function setActiveProjectId(id: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, id.trim());
    }
  } catch {
    // Ignore storage write errors
  }
}

export function clearActiveProjectId(): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage removal errors
  }
}
