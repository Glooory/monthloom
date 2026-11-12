import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePreviewResource } from "./usePreviewResource";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("atomic preview resources", () => {
  it("keeps the last complete result on failure and permits retry", async () => {
    const pending = deferred<string>();
    const load = vi
      .fn()
      .mockResolvedValueOnce("old")
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce("new");
    const { result, rerender } = renderHook(
      ({ key }) => usePreviewResource({ resourceKey: key, load }),
      { initialProps: { key: 1 } },
    );
    await waitFor(() => expect(result.current.value).toBe("old"));
    rerender({ key: 2 });
    expect(result.current.value).toBe("old");
    await act(async () => {
      pending.reject(new Error("render failed"));
    });
    expect(result.current.value).toBe("old");
    expect(result.current.error?.message).toBe("render failed");
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.value).toBe("new"));
    expect(result.current.error).toBeNull();
  });

  it("rejects late completions from superseded requests", async () => {
    const old = deferred<string>();
    const load = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce("latest");
    const { result, rerender } = renderHook(
      ({ key }) => usePreviewResource({ resourceKey: key, load }),
      { initialProps: { key: 1 } },
    );
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    rerender({ key: 2 });
    await waitFor(() => expect(result.current.value).toBe("latest"));
    await act(async () => old.resolve("obsolete"));
    expect(result.current.value).toBe("latest");
  });

  it("never supplies an old engine to new inputs, including after failed resolution", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce("old engine")
      .mockRejectedValueOnce(new Error("missing font"));
    const { result, rerender } = renderHook(
      ({ key }) =>
        usePreviewResource({ resourceKey: key, load, retainPrevious: false }),
      { initialProps: { key: 1 } },
    );
    await waitFor(() => expect(result.current.value).toBe("old engine"));
    rerender({ key: 2 });
    expect(result.current.value).toBeNull();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.value).toBeNull();
  });
});
