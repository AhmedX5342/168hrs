import { dayOfWeek, timeToMin, weekDates } from "@/lib/dates";
import type { Block, Task } from "./types";

/** A day can hold at most 24h of scheduled work. */
export const DAY_MIN = 24 * 60;

type Occurrence = Pick<Task, "repeat" | "date" | "days" | "weekStart">;

export function occursOn(task: Occurrence, date: string): boolean {
  if (task.repeat === "once") return task.date === date;
  if (date < task.weekStart) return false;
  if (task.repeat === "daily") return true;
  return task.days.includes(dayOfWeek(date));
}

/** Unscheduled = a one-time task with no day yet. A time of day is optional. */
export const isUnscheduled = (t: Task) => t.repeat === "once" && !t.date;
export const isScheduled = (t: Task) => !isUnscheduled(t);

/** Minutes already booked on a date (recurring + one-off), optionally ignoring one task. */
export function dayLoadMin(tasks: Task[], date: string, excludeId?: string): number {
  let total = 0;
  for (const t of tasks) {
    if (t.id === excludeId || isUnscheduled(t)) continue;
    if (occursOn(t, date)) total += t.duration;
  }
  return total;
}

/**
 * First day on which adding/changing this task would push the day past 24h, or null.
 * Recurring tasks are checked across their start week.
 */
export function firstFullDay(
  tasks: Task[],
  candidate: Occurrence & Pick<Task, "duration">,
  excludeId?: string,
): string | null {
  const dates =
    candidate.repeat === "once"
      ? candidate.date
        ? [candidate.date]
        : []
      : weekDates(candidate.weekStart);
  for (const d of dates) {
    if (occursOn(candidate, d) && dayLoadMin(tasks, d, excludeId) + candidate.duration > DAY_MIN) {
      return d;
    }
  }
  return null;
}

/** Scheduled blocks, plus optional unscheduled / overdue blocks, for a day. */
export function blocksForDate(
  tasks: Task[],
  date: string,
  opts?: { showUnscheduled?: boolean; weekStart?: string; includeOverdue?: boolean },
): Block[] {
  const showUnscheduled = opts?.showUnscheduled ?? false;
  const weekStart = opts?.weekStart;

  // Anything with a day: timed ones sort by time, untimed ones come after
  const scheduled: Block[] = tasks
    .filter((t) => isScheduled(t) && occursOn(t, date))
    .map((t, i) => {
      const start = t.startTime ? timeToMin(t.startTime) : 24 * 60 + i;
      return {
        task: t,
        date,
        start,
        end: start + t.duration,
        // A one-time task counts as done whenever it was finished, even if finished late
        done: t.repeat === "once" ? t.completions.length > 0 : t.completions.includes(date),
        unscheduled: false,
      };
    });

  // One-time tasks with no day yet (floating through the week)
  const unscheduled: Block[] =
    showUnscheduled && weekStart
      ? tasks
          .filter(
            (t) =>
              isUnscheduled(t) &&
              t.weekStart === weekStart &&
              (t.completions.length === 0 || t.completions.includes(date)),
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

  // One-time tasks from earlier days that were never finished (or were finished late, today)
  const overdue: Block[] = opts?.includeOverdue
    ? tasks
        .filter(
          (t) =>
            t.repeat === "once" &&
            !!t.date &&
            t.date < date &&
            (t.completions.length === 0 || t.completions.includes(date)),
        )
        .sort(
          (a, b) =>
            a.date!.localeCompare(b.date!) || (a.startTime ?? "").localeCompare(b.startTime ?? ""),
        )
        .map((t, i) => ({
          task: t,
          date,
          start: -100_000 + i, // sort before everything else
          end: -100_000 + i + t.duration,
          done: t.completions.includes(date),
          unscheduled: false,
          overdue: true,
        }))
    : [];

  return [...scheduled, ...unscheduled, ...overdue].sort((a, b) => a.start - b.start);
}

/** Tasks visible in a given week's library */
export const tasksForWeek = (tasks: Task[], weekStart: string) =>
  tasks.filter((t) => (t.repeat === "once" ? t.weekStart === weekStart : t.weekStart <= weekStart));

/** Remaining incomplete work (minutes) for the week */
export function remainingWorkMin(
  tasks: Task[],
  weekStart: string,
  weekDatesList: string[],
): number {
  let total = 0;
  for (const t of tasksForWeek(tasks, weekStart)) {
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
export function plannedWeekMin(tasks: Task[], weekStart: string, weekDatesList: string[]): number {
  let total = 0;
  for (const t of tasksForWeek(tasks, weekStart)) {
    if (isUnscheduled(t)) {
      total += t.duration;
      continue;
    }
    for (const d of weekDatesList) {
      if (occursOn(t, d)) total += t.duration;
    }
  }
  return total;
}

export interface TaskStatus {
  /** Date a one-time task was completed */
  completedOn?: string;
  /** Some progress saved but not finished */
  partial?: { startedAt?: string | undefined; pct: number };
  /** Date a one-time task was scheduled for but wasn't completed */
  dueOn?: string;
  /** Recurring: completed occurrences this week */
  doneCount?: number;
  occurrences?: number;
}

export function taskStatus(t: Task, today: string, weekStart?: string): TaskStatus {
  const pctOf = (p: { elapsed: number; total: number }) =>
    Math.min(100, Math.round((p.elapsed / Math.max(1, p.total)) * 100));

  if (t.repeat === "once") {
    const completedOn = [...t.completions].sort().at(-1);
    if (completedOn) return { completedOn };
    const status: TaskStatus = {};
    const p = Object.values(t.progress ?? {}).find((x) => x.elapsed > 0);
    if (p) status.partial = { startedAt: p.startedAt, pct: pctOf(p) };
    if (t.date && t.date < today) status.dueOn = t.date;
    return status;
  }

  const dates = weekDates(weekStart ?? t.weekStart).filter((d) => occursOn(t, d));
  const status: TaskStatus = {
    occurrences: dates.length,
    doneCount: dates.filter((d) => t.completions.includes(d)).length,
  };
  const partials = dates
    .filter((d) => !t.completions.includes(d) && (t.progress?.[d]?.elapsed ?? 0) > 0)
    .map((d) => t.progress![d]!);
  if (partials.length) {
    const first = partials
      .map((p) => p.startedAt)
      .filter(Boolean)
      .sort()[0];
    status.partial = { startedAt: first, pct: pctOf(partials[0]!) };
  }
  return status;
}
