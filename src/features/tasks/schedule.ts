import { dayOfWeek, timeToMin } from "@/lib/dates";
import type { Block, Task } from "./types";

export function occursOn(task: Task, date: string): boolean {
  if (task.repeat === "once") return task.date === date;
  if (date < task.weekStart) return false;
  const dow = dayOfWeek(date);
  if (task.repeat === "daily") return true;
  if (task.repeat === "weekdays") return dow >= 1 && dow <= 5;
  return task.days.includes(dow);
}

export const isScheduled = (t: Task) =>
  !!t.startTime && (t.repeat !== "once" || !!t.date);

export function blocksForDate(tasks: Task[], date: string): Block[] {
  return tasks
    .filter((t) => isScheduled(t) && occursOn(t, date))
    .map((t) => {
      const start = timeToMin(t.startTime!);
      return { task: t, date, start, end: start + t.duration, done: t.completions.includes(date) };
    })
    .sort((a, b) => a.start - b.start);
}

/** Tasks visible in a given week's library */
export const tasksForWeek = (tasks: Task[], weekStart: string) =>
  tasks.filter((t) => (t.repeat === "once" ? t.weekStart === weekStart : t.weekStart <= weekStart));
