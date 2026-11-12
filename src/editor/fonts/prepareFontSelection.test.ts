import { describe, expect, it, vi } from "vitest";
import { FontSelectionRequest } from "./prepareFontSelection";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("font selection preparation", () => {
  it("does not commit until preparation succeeds and leaves history unchanged on failure", async () => {
    const request = new FontSelectionRequest();
    const pending = deferred();
    const commit = vi.fn();
    const result = request.run({
      prepare: () => pending.promise,
      isCurrent: () => true,
      commit,
    });
    expect(commit).not.toHaveBeenCalled();
    pending.reject(new Error("offline"));
    await expect(result).rejects.toThrow("offline");
    expect(commit).not.toHaveBeenCalled();
    await request.run({
      prepare: async () => {},
      isCurrent: () => true,
      commit,
    });
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("only applies the latest selection even when downloads finish out of order", async () => {
    const request = new FontSelectionRequest();
    const first = deferred();
    const oldCommit = vi.fn();
    const nextCommit = vi.fn();
    const old = request.run({
      prepare: () => first.promise,
      isCurrent: () => true,
      commit: oldCommit,
    });
    await request.run({
      prepare: async () => {},
      isCurrent: () => true,
      commit: nextCommit,
    });
    first.resolve();
    expect(await old).toBe(false);
    expect(oldCommit).not.toHaveBeenCalled();
    expect(nextCommit).toHaveBeenCalledTimes(1);
  });

  it("ignores completion after cancel, undo, document replacement or selection change", async () => {
    for (const explicitCancel of [true, false]) {
      const request = new FontSelectionRequest();
      const pending = deferred();
      const commit = vi.fn();
      let current = true;
      const result = request.run({
        prepare: () => pending.promise,
        isCurrent: () => current,
        commit,
      });
      if (explicitCancel) request.cancel();
      else current = false;
      pending.resolve();
      expect(await result).toBe(false);
      expect(commit).not.toHaveBeenCalled();
    }
  });
});
