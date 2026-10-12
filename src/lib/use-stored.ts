import { useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadKey, saveKey, type StorageKey } from "./storage";

/**
 * React Query binding for a collection stored in IndexedDB (Dexie).
 *
 * The cache is filled by initStorage() before the app renders. `update` changes the cache
 * immediately (so back-to-back updates compose correctly) and then persists only the
 * difference. If persisting fails the cache is rolled back and the error is rethrown.
 */
export function useStored<T>(key: StorageKey, fallback: T) {
  const qc = useQueryClient();
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const query = useQuery({
    queryKey: ["store", key],
    queryFn: () => loadKey<T>(key, fallbackRef.current),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const update = useCallback(
    async (updater: (prev: T) => T): Promise<T> => {
      const prev =
        qc.getQueryData<T>(["store", key]) ?? (await loadKey<T>(key, fallbackRef.current));
      const next = updater(prev);
      if (next === prev) return prev;
      qc.setQueryData(["store", key], next);
      try {
        await saveKey(key, prev, next);
      } catch (e) {
        qc.setQueryData(["store", key], prev);
        throw e;
      }
      return next;
    },
    [qc, key],
  );

  return { data: (query.data ?? fallback) as T, update };
}
