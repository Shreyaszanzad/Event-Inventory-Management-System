import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Runs an API call and tracks `{ data, loading, error }` for it.
 *
 * Mock data was instant; a real API is not, so every page needs the three states
 * (integration plan YG-11). Keeping that here means each page declares what it
 * wants once instead of hand-rolling three `useState`s.
 *
 * @param fetcher  async () => data. Must be stable — wrap it in `useCallback`,
 *                 or let `deps` change identify when it should re-run.
 * @param deps     dependency list; the call re-runs when these change.
 * @param options  `{ enabled }` — skip the call entirely while false (e.g. a
 *                 detail fetch waiting on an id).
 */
export const useApiData = (fetcher, deps = [], { enabled = true } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Guards against a slow first response landing after a newer one.
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mounted.current && id === requestId.current) setData(result);
    } catch (err) {
      if (mounted.current && id === requestId.current) {
        setError(err);
        setData(null);
      }
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false);
    }
    // `fetcher` is intentionally not a dependency — callers control re-runs via `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
};
