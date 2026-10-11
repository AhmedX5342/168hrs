import { useCallback, useEffect, useMemo } from "react";
import { addDays, startOfWeek, todayISO } from "@/lib/dates";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";
import { useSettings } from "@/features/settings/use-settings";

export function useWeeks() {
  const { settings } = useSettings();
  const { data, update } = useStored<string[]>(STORAGE_KEYS.weeks, []);
  const currentWeek = startOfWeek(todayISO(), settings.weekStartsOn);
  const weeks = useMemo(() => [...new Set(data)].sort(), [data]);

  /** Auto-create weeks up to (and including) the current one. */
  const ensureWeeks = useCallback(
    () =>
      update((prev) => {
        const set = new Set(prev);
        if (set.has(currentWeek)) return prev;
        const last = [...set]
          .filter((w) => w < currentWeek)
          .sort()
          .at(-1);
        if (last) for (let w = addDays(last, 7); w < currentWeek; w = addDays(w, 7)) set.add(w);
        set.add(currentWeek);
        return [...set].sort();
      }),
    [update, currentWeek],
  );

  const createUpcomingWeek = useCallback(
    () =>
      update((prev) => {
        const last = [...prev, currentWeek].sort().at(-1)!;
        return [...new Set([...prev, addDays(last, 7)])].sort();
      }),
    [update, currentWeek],
  );

  const weekNumber = (w: string) => weeks.indexOf(w) + 1;

  return { weeks, currentWeek, ensureWeeks, createUpcomingWeek, weekNumber };
}

export function useEnsureWeeks() {
  const { ensureWeeks } = useWeeks();
  useEffect(() => {
    void ensureWeeks();
  }, [ensureWeeks]);
}
