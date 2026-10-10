import { useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";
import { DEFAULT_SETTINGS, type Settings } from "./types";

export function useSettings() {
  const { data, update } = useStored<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const settings = { ...DEFAULT_SETTINGS, ...data };
  const patch = useCallback(
    (p: Partial<Settings>) => update((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...p })),
    [update],
  );
  return { settings, patch };
}
