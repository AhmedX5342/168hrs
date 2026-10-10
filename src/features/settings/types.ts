export interface LifeArea {
  id: string;
  name: string;
  icon: string;
}

export interface Settings {
  name: string;
  onboarded: boolean;
  weekStartsOn: 0 | 1;
  sleepHours: number;
  theme: "light" | "dark";
  lifeAreas: LifeArea[];
}

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  onboarded: false,
  weekStartsOn: 1,
  sleepHours: 56,
  theme: "light",
  lifeAreas: [
    { id: "work", name: "Work", icon: "briefcase" },
    { id: "fitness", name: "Fitness", icon: "dumbbell" },
    { id: "study", name: "Study", icon: "graduation-cap" },
    { id: "personal", name: "Personal", icon: "heart" },
  ],
};
