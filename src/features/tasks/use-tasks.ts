import { useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";
import type { Task } from "./types";

export type TaskInput = Omit<Task, "id" | "completions" | "createdAt">;

export function useTasks() {
  const { data: tasks, update } = useStored<Task[]>(STORAGE_KEYS.tasks, []);

  const addTask = useCallback(
    (input: TaskInput) =>
      update((prev) => [
        ...prev,
        { ...input, id: crypto.randomUUID(), completions: [], createdAt: Date.now() },
      ]),
    [update],
  );
  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) =>
      update((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [update],
  );
  const deleteTask = useCallback(
    (id: string) => update((prev) => prev.filter((t) => t.id !== id)),
    [update],
  );
  const setCompleted = useCallback(
    (id: string, date: string, done: boolean) =>
      update((prev) =>
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
    [update],
  );

  return { tasks, addTask, updateTask, deleteTask, setCompleted };
}
