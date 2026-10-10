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
}

export interface Block {
  task: Task;
  date: string;
  start: number;
  end: number;
  done: boolean;
}

export const FOCUS_LABEL: Record<Focus, string> = { deep: "Deep", medium: "Medium", light: "Light" };
