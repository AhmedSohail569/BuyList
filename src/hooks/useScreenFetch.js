/**
 * useScreenFetch
 *
 * A reusable hook for screen-level data fetching using useFocusEffect.
 *
 * Behaviour:
 *  - First visit:  shows `loading = true`, fetches, stores result.
 *  - Return visits: immediately renders existing data, refreshes in background
 *    without showing a loader.
 *  - Background failures do NOT clear existing data.
 *  - Prevents concurrent in-flight fetches while the screen is focused.
 *
 * Usage:
 *   const { loading, refresh } = useScreenFetch(
 *     () => dispatch(fetchSomething()),
 *     hasData, // boolean — true when Redux already has stale data to show
 *   );
 */
import { useRef, useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

const useScreenFetch = (fetchFn, hasData = false) => {
  // Track whether this is the very first mount (no cached data available)
  const isFirstLoad = useRef(!hasData);
  const [loading, setLoading] = useState(!hasData);
  const isFetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const isFirst = isFirstLoad.current;
    if (isFirst) setLoading(true);

    try {
      await fetchFn();
    } catch {
      // Background refresh failures are intentionally swallowed to preserve
      // existing UI state. Reducers/actions handle their own error toasts.
    } finally {
      isFetchingRef.current = false;
      if (isFirst) {
        isFirstLoad.current = false;
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { loading, refresh };
};

export default useScreenFetch;
