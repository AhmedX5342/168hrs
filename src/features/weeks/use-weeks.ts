import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addDays, startOfWeek, todayISO } from "@/lib/dates";
import { db } from "@/lib/db";
import { STORAGE_KEYS, loadKey } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";
import { useSettings } from "@/features/settings/use-settings";
import { normalizeTask, useTasks } from "@/features/tasks/use-tasks";
import type { Task } from "@/features/tasks/types";

const CARRY_FLAG = "lastCarriedWeek";

export function useWeeks() {
  const { settings } = useSettings();
  const { data, update } = useStored<string[]>(STORAGE_KEYS.weeks, []);
  const currentWeek = startOfWeek(todayISO(), settings.weekStartsOn);
  const weeks = useMemo(() => [...new Set(data)].sort(), [data]);

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

/**
 * Ensures week list is current and carries unfinished one-time / weekly tasks
 * from the previous week into the current week (once per week transition).
 */
export function useEnsureWeeks() {
  const { ensureWeeks, currentWeek } = useWeeks();
  const { carryUnfinishedIntoWeek } = useTasks();
  const qc = useQueryClient();
  const ranFor = useRef<string | null>(null);

  useEffect(() => {
    void ensureWeeks();
  }, [ensureWeeks]);

  useEffect(() => {
    if (ranFor.current === currentWeek) return;
    ranFor.current = currentWeek;

    void (async () => {
      try {
        const flag = await db.kv.get(CARRY_FLAG);
        if (flag?.value === currentWeek) return;

        const prevWeek = addDays(currentWeek, -7);
        await carryUnfinishedIntoWeek(currentWeek, prevWeek);
        await db.kv.put({ key: CARRY_FLAG, value: currentWeek });

        const tasks = await loadKey<Task[]>(STORAGE_KEYS.tasks, []);
        qc.setQueryData(["store", STORAGE_KEYS.tasks], tasks.map(normalizeTask));
      } catch {
        /* non-fatal — app still works without carry */
      }
    })();
  }, [currentWeek, carryUnfinishedIntoWeek, qc]);
}
