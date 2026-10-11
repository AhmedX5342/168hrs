export type Focus = "deep" | "medium" | "light";

/** "days" = weekly on the chosen days */
export type RepeatType = "once" | "daily" | "days";

/** Saved focus-session progress for one occurrence of a task (seconds). */
export interface TaskProgress {
  elapsed: number;
  /** Session length, includes any "+15 min" extensions */
  total: number;
  /** ISO date the first session was started */
  startedAt?: string;
}

export interface Task {
  id: string;
  /** ISO start date of the week this task was created in */
  weekStart: string;
  title: string;
  /** minutes */
  duration: number;
  focus: Focus;
  notes?: string;
  lifeAreaId?: string;
  repeat: RepeatType;
  /** JS weekday numbers (0 = Sun) when repeat === "days" */
  days: number[];
  /** ISO date for one-off tasks; null = unscheduled (no day yet) */
  date: string | null;
  /** "HH:MM"; null = no specific time (the task is still scheduled for its day) */
  startTime: string | null;
  /** ISO dates on which the task was completed */
  completions: string[];
  /** Partially completed focus sessions, keyed by ISO date */
  progress?: Record<string, TaskProgress>;
  createdAt: number;
  /** Sudden / ad-hoc work outside the plan */
  unexpected?: boolean;
}

export interface Block {
  task: Task;
  date: string;
  start: number;
  end: number;
  done: boolean;
  unscheduled?: boolean;
  /** One-time task whose planned day has passed and is still open (or was finished late today) */
  overdue?: boolean;
}

/**
 * Key under which a block's partial progress is stored.
 * One-time tasks keep one shared progress entry for the task itself, so it
 * survives rescheduling and can be resumed on any day. Recurring tasks track each date separately.
 */
export const progressKey = (b: Pick<Block, "date" | "task">): string =>
  b.task.repeat === "once" ? "floating" : b.date;

export const FOCUS_LABEL: Record<Focus, string> = {
  deep: "Deep",
  medium: "Medium",
  light: "Light",
};

/** Distinct bar colors for life areas on the week chart */
export const LIFE_AREA_COLORS = [
  "bg-primary",
  "bg-focus-deep",
  "bg-focus-medium",
  "bg-focus-light",
  "bg-success",
  "bg-accent",
  "bg-secondary-foreground/40",
];

export const UNEXPECTED_BAR = "bg-destructive";
