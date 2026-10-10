import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readStore, writeStore, type StorageKey } from "./storage";

/**
 * React Query binding for a localStorage-backed value.
 * Only call from components rendered after hydration (AppLayout guarantees this).
 */
export function useStored<T>(key: StorageKey, fallback: T) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["store", key],
    queryFn: () => readStore<T>(key, fallback),
    initialData: () => readStore<T>(key, fallback),
    staleTime: Infinity,
  });
  const mutation = useMutation({
    mutationFn: async (updater: (prev: T) => T) => {
      const next = updater(readStore<T>(key, fallback));
      writeStore(key, next);
      return next;
    },
    onSuccess: (data) => qc.setQueryData(["store", key], data),
  });
  return { data: query.data as T, update: mutation.mutateAsync };
}
