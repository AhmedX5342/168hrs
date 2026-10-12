import { dayOfWeek, timeToMin, weekDates } from "@/lib/dates";
import { weeklyProgressKey, type Block, type Task } from "./types";

/** A day can hold at most 24h of scheduled work. */
export const DAY_MIN = 24 * 60;

type Occurrence = Pick<Task, "repeat" | "date" | "days" | "weekStart">;

/** Weekly = once per week, done anytime during the week (not tied to a day). */
export const isWeekly = (t: Pick<Task, "repeat">) => t.repeat === "weekly";

/** The date a weekly task was completed within the given week, if any */
export function weeklyDoneOn(t: Task, weekStart: string): string | undefined {
  const days = weekDates(weekStart);
  return [...t.completions].sort().find((c) => days.includes(c));
}

export function occursOn(task: Occurrence, date: string): boolean {
  if (task.repeat === "once") return task.date === date;
  if (task.repeat === "weekly") return false; // not tied to a specific day
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

/** Scheduled blocks, plus optional unscheduled / overdue / weekly blocks, for a day. */
export function blocksForDate(
  tasks: Task[],
  date: string,
  opts?: {
    showUnscheduled?: boolean;
    weekStart?: string;
    includeOverdue?: boolean;
    /** Completed weekly tasks, shown on the day they were completed */
    includeWeekly?: boolean;
    /** Uncompleted weekly tasks, shown on this day (use for "today") */
    includeWeeklyPending?: boolean;
  },
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

  // Weekly tasks: pending ones float on "today", completed ones sit on their completion day
  const weekly: Block[] = [];
  if (weekStart && (opts?.includeWeekly || opts?.includeWeeklyPending)) {
    if (weekDates(weekStart).includes(date)) {
      tasksForWeek(tasks, weekStart)
        .filter(isWeekly)
        .forEach((t, i) => {
          const doneOn = weeklyDoneOn(t, weekStart);
          const base = {
            task: t,
            date,
            start: 24 * 60 + 500 + i,
            end: 24 * 60 + 500 + i + t.duration,
            unscheduled: false,
            weekly: true,
            weekStart,
          };
          if (doneOn) {
            if (opts?.includeWeekly && doneOn === date) weekly.push({ ...base, done: true });
          } else if (opts?.includeWeeklyPending) {
            weekly.push({ ...base, done: false });
          }
        });
    }
  }

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

  const combined = [...scheduled, ...weekly, ...unscheduled, ...overdue];

  // Attach per-day work seconds; add a work-log-only block when this day has effort
  // but the task is not already listed (e.g. worked Sunday on a task dated Monday).
  const seen = new Set(combined.map((b) => b.task.id));
  for (const b of combined) {
    const sec = b.task.workLog?.[date] ?? 0;
    if (sec > 0) b.dayWorkSec = sec;
  }
  let logI = 0;
  for (const t of tasks) {
    const sec = t.workLog?.[date] ?? 0;
    if (sec <= 0 || seen.has(t.id)) continue;
    combined.push({
      task: t,
      date,
      start: 26 * 60 + logI,
      end: 26 * 60 + logI + t.duration,
      done: t.repeat === "once" ? t.completions.length > 0 : t.completions.includes(date),
      dayWorkSec: sec,
      workLogOnly: true,
    });
    logI++;
  }

  return combined.sort((a, b) => a.start - b.start);
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
    if (isWeekly(t)) {
      if (!weeklyDoneOn(t, weekStart)) total += t.duration;
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
    if (isUnscheduled(t) || isWeekly(t)) {
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
  /** Date a one-time (or weekly) task was completed */
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

  if (t.repeat === "weekly") {
    const ws = weekStart ?? t.weekStart;
    const completedOn = weeklyDoneOn(t, ws);
    if (completedOn) return { completedOn };
    const status: TaskStatus = {};
    const p = t.progress?.[weeklyProgressKey(ws)];
    if (p && p.elapsed > 0) status.partial = { startedAt: p.startedAt, pct: pctOf(p) };
    return status;
  }

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
