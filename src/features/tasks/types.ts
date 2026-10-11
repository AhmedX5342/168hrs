export type Focus = "deep" | "medium" | "light";

export type RepeatType = "once" | "daily" | "weekdays" | "days";

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
  /** ISO date for one-off tasks; null = unscheduled */
  date: string | null;
  /** "HH:MM"; null = unscheduled */
  startTime: string | null;
  /** ISO dates on which the task was completed */
  completions: string[];
  createdAt: number;
  /** Can be completed any day within its week */
  openEnded?: boolean;
  /** Sudden / ad-hoc work outside the plan */
  unexpected?: boolean;
  /** Links multi-session open-ended batches (e.g. 3 workouts) */
  groupId?: string;
}

export interface Block {
  task: Task;
  date: string;
  start: number;
  end: number;
  done: boolean;
  unscheduled?: boolean;
}

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
