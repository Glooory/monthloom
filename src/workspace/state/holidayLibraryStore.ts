import { create } from "zustand";
import type { HolidayLibrarySnapshot } from "../../domain/holiday/types";
import { db } from "../../persistence/db/monthloomDb";
import { HolidayLibraryRepository } from "../../persistence/db/holidayLibraryRepository";

const defaultRepository = new HolidayLibraryRepository(db);

const EMPTY_SNAPSHOT: HolidayLibrarySnapshot = {
  calendars: [],
  baseRecords: [],
  overrides: [],
  coverage: [],
  syncStates: [],
};

export type HolidayLibraryStore = {
  snapshot: HolidayLibrarySnapshot;
  status: "idle" | "loading" | "ready" | "error";
  error: Error | null;
  hydrate: (repository?: HolidayLibraryRepository) => Promise<void>;
  refresh: (repository?: HolidayLibraryRepository) => Promise<void>;
};

export const useHolidayLibraryStore = create<HolidayLibraryStore>((set) => ({
  snapshot: EMPTY_SNAPSHOT,
  status: "idle",
  error: null,

  hydrate: async (repository = defaultRepository) => {
    set({ status: "loading", error: null });
    try {
      await repository.ensureBuiltins();
      const snapshot = await repository.getSnapshot();
      set({ snapshot, status: "ready", error: null });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  },

  refresh: async (repository = defaultRepository) => {
    try {
      const snapshot = await repository.getSnapshot();
      set({ snapshot, status: "ready", error: null });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  },
}));
