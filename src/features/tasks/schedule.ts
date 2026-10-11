import { dayOfWeek, timeToMin } from "@/lib/dates";
import type { Block, Task } from "./types";

export function occursOn(task: Task, date: string): boolean {
  if (task.openEnded) {
    if (date < task.weekStart) return false;
    // weekStart + 6 days inclusive
    const [y, m, d] = task.weekStart.split("-").map(Number);
    const end = new Date(y!, m! - 1, d! + 6);
    const endIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    return date <= endIso;
  }
  if (task.repeat === "once") return task.date === date;
  if (date < task.weekStart) return false;
  const dow = dayOfWeek(date);
  if (task.repeat === "daily") return true;
  if (task.repeat === "weekdays") return dow >= 1 && dow <= 5;
  return task.days.includes(dow);
}

export const isScheduled = (t: Task) =>
  !t.openEnded && !!t.startTime && (t.repeat !== "once" || !!t.date);

export const isUnscheduled = (t: Task) =>
  !t.openEnded && !isScheduled(t) && (t.repeat === "once" ? !t.date || !t.startTime : !t.startTime);

/** Scheduled blocks + optional unscheduled / open-ended for the day */
export function blocksForDate(
  tasks: Task[],
  date: string,
  opts?: { showUnscheduled?: boolean; weekStart?: string },
): Block[] {
  const showUnscheduled = opts?.showUnscheduled ?? false;
  const weekStart = opts?.weekStart;

  const scheduled = tasks
    .filter((t) => isScheduled(t) && occursOn(t, date))
    .map((t) => {
      const start = timeToMin(t.startTime!);
      return {
        task: t,
        date,
        start,
        end: start + t.duration,
        done: t.completions.includes(date),
        unscheduled: false,
      } satisfies Block;
    });

  const openEnded = tasks
    .filter((t) => t.openEnded && occursOn(t, date) && t.completions.length === 0)
    .map((t, i) => ({
      task: t,
      date,
      start: 24 * 60 + i, // after day, sort last
      end: 24 * 60 + i + t.duration,
      done: t.completions.includes(date),
      unscheduled: true,
    }));

  const unscheduled =
    showUnscheduled && weekStart
      ? tasks
          .filter(
            (t) =>
              isUnscheduled(t) &&
              t.weekStart === weekStart &&
              !t.completions.includes(date) &&
              (t.repeat === "once" ? true : occursOn(t, date) || !t.startTime),
          )
          .map((t, i) => ({
            task: t,
            date,
            start: 25 * 60 + i,
            end: 25 * 60 + i + t.duration,
            done: t.completions.includes(date),
            unscheduled: true,
          }))
      : [];

  return [...scheduled, ...openEnded, ...unscheduled].sort((a, b) => a.start - b.start);
}

/** Tasks visible in a given week's library */
export const tasksForWeek = (tasks: Task[], weekStart: string) =>
  tasks.filter((t) => (t.repeat === "once" || t.openEnded ? t.weekStart === weekStart : t.weekStart <= weekStart));

/** Remaining incomplete work (minutes) for the week */
export function remainingWorkMin(tasks: Task[], weekStart: string, weekDatesList: string[]): number {
  const list = tasksForWeek(tasks, weekStart);
  let total = 0;
  for (const t of list) {
    if (t.openEnded) {
      if (t.completions.length === 0) total += t.duration;
      continue;
    }
    if (t.repeat === "once") {
      if (!t.completions.length) total += t.duration;
      continue;
    }
    for (const d of weekDatesList) {
      if (occursOn(t, d) && !t.completions.includes(d)) total += t.duration;
    }
  }
  return total;
}

/** Planned minutes in week (all occurrences, including done) */
/** Planned minutes in week (all occurrences, including done) */
export function plannedWeekMin(tasks: Task[], weekStart: string, weekDatesList: string[]): number {
  let total = 0;
  const countedOnce = new Set<string>();
  for (const t of tasksForWeek(tasks, weekStart)) {
    if (t.openEnded || (t.repeat === "once" && isUnscheduled(t))) {
      if (!countedOnce.has(t.id)) {
        countedOnce.add(t.id);
        total += t.duration;
      }
      continue;
    }
    for (const d of weekDatesList) {
      if (occursOn(t, d)) total += t.duration;
    }
  }
  return total;
}
