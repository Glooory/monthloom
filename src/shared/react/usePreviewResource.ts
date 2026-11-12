import { useCallback, useEffect, useState } from "react";

/** Replace a complete result atomically; stale completions never update the view. */
export function usePreviewResource<T>(args: {
  resourceKey: unknown;
  load: () => Promise<T>;
  retainPrevious?: boolean;
}) {
  const { resourceKey, load, retainPrevious = true } = args;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    key: unknown;
    attempt: number;
    value: T | null;
    loading: boolean;
    error: Error | null;
  }>({ key: resourceKey, attempt: 0, value: null, loading: true, error: null });
  useEffect(() => {
    let current = true;
    setState((previous) => ({
      ...previous,
      key: resourceKey,
      attempt,
      loading: true,
      error: null,
    }));
    void Promise.resolve()
      .then(load)
      .then(
        (value) => {
          if (current)
            setState({
              key: resourceKey,
              attempt,
              value,
              loading: false,
              error: null,
            });
        },
        (error) => {
          if (current)
            setState((previous) => ({
              ...previous,
              loading: false,
              error: error instanceof Error ? error : new Error(String(error)),
            }));
        },
      );
    return () => {
      current = false;
    };
    // load describes this exact resourceKey; changes to it alone are not requests.
  }, [resourceKey, attempt]);
  const current = state.key === resourceKey && state.attempt === attempt;
  const loading = !current || state.loading;
  return {
    value:
      retainPrevious || (current && !loading && !state.error)
        ? state.value
        : null,
    loading,
    error: current ? state.error : null,
    retry: useCallback(() => setAttempt((value) => value + 1), []),
  };
}
