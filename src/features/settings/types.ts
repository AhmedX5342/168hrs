export interface LifeArea {
  id: string;
  name: string;
  icon: string;
  /** Hex color used for this area's tasks everywhere in the app */
  color: string;
}

/** 0 = Sunday … 6 = Saturday */
export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Settings {
  name: string;
  onboarded: boolean;
  weekStartsOn: WeekStartDay;
  /** Target sleep hours per night (not per week) */
  sleepHoursPerDay: number;
  /** Preferred bedtime "HH:MM" */
  sleepBedtime: string;
  /** Preferred wake time "HH:MM" */
  sleepWakeTarget: string;
  /** Hours above this count as wasted sleep */
  idealSleepHours: number;
  clockFormat: "12" | "24";
  /** Show unscheduled week tasks on Today and in capacity math */
  showUnscheduled: boolean;
  /** Show Notes in navigation */
  notesEnabled: boolean;
  theme: "light" | "dark";
  lifeAreas: LifeArea[];
  /** @deprecated migrated to sleepHoursPerDay */
  sleepHours?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  onboarded: false,
  weekStartsOn: 1,
  sleepHoursPerDay: 8,
  sleepBedtime: "23:00",
  sleepWakeTarget: "07:00",
  idealSleepHours: 8,
  clockFormat: "24",
  showUnscheduled: true,
  notesEnabled: true,
  theme: "light",
  lifeAreas: [
    { id: "work", name: "Work", icon: "briefcase", color: "#2f80ed" },
    { id: "fitness", name: "Fitness", icon: "dumbbell", color: "#27ae60" },
    { id: "study", name: "Study", icon: "graduation-cap", color: "#9b51e0" },
    { id: "personal", name: "Personal", icon: "heart", color: "#ec4899" },
  ],
};

export const WEEKDAY_OPTIONS: { value: WeekStartDay; label: string }[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export interface SleepLog {
  date: string;
  /** Actual wake time "HH:MM" */
  wokeAt: string;
  /** Optional actual bedtime previous night */
  bedAt?: string;
}
