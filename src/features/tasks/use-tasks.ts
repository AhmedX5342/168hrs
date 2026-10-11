import { useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";
import { todayISO } from "@/lib/dates";
import type { RepeatType, Task, TaskProgress } from "./types";

export type TaskInput = Omit<Task, "id" | "completions" | "createdAt">;

/**
 * Upgrades tasks saved by older versions:
 * - "weekdays" repeat → weekly on Mon–Fri
 * - open-ended tasks → plain unscheduled one-time tasks
 */
export function normalizeTask(t: Task): Task {
  const legacy = t as unknown as { repeat: RepeatType | "weekdays"; openEnded?: boolean };
  let next: Task = t;
  if (legacy.repeat === "weekdays") next = { ...next, repeat: "days", days: [1, 2, 3, 4, 5] };
  if (legacy.openEnded) {
    const copy = { ...next } as unknown as Record<string, unknown>;
    delete copy.openEnded;
    delete copy.groupId;
    next = { ...(copy as unknown as Task), repeat: "once", date: null, startTime: null };
  }
  return next;
}

export function useTasks() {
  const { data: raw, update } = useStored<Task[]>(STORAGE_KEYS.tasks, []);
  const tasks = useMemo(() => raw.map(normalizeTask), [raw]);

  /** Every write also persists the normalized shape. */
  const mutate = useCallback(
    (fn: (prev: Task[]) => Task[]) => update((prev) => fn(prev.map(normalizeTask))),
    [update],
  );

  const addTask = useCallback(
    (input: TaskInput) =>
      mutate((prev) => [
        ...prev,
        { ...input, id: crypto.randomUUID(), completions: [], createdAt: Date.now() },
      ]),
    [mutate],
  );
  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) =>
      mutate((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [mutate],
  );
  const deleteTask = useCallback(
    (id: string) => mutate((prev) => prev.filter((t) => t.id !== id)),
    [mutate],
  );
  const setCompleted = useCallback(
    (id: string, date: string, done: boolean) =>
      mutate((prev) =>
        prev.map((t) =>
          t.id !== id
            ? t
            : {
                ...t,
                completions: done
                  ? Array.from(new Set([...t.completions, date]))
                  : t.completions.filter((d) => d !== date),
              },
        ),
      ),
    [mutate],
  );

  /** Save (or clear, with null / zero elapsed) partial progress for a task under a key. */
  const setProgress = useCallback(
    (id: string, key: string, p: TaskProgress | null) =>
      mutate((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const progress = { ...(t.progress ?? {}) };
          if (p && p.elapsed > 0) {
            progress[key] = {
              ...p,
              startedAt: progress[key]?.startedAt ?? p.startedAt ?? todayISO(),
            };
          } else delete progress[key];
          return { ...t, progress };
        }),
      ),
    [mutate],
  );

  return { tasks, addTask, updateTask, deleteTask, setCompleted, setProgress };
}
