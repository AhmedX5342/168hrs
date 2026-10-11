import { useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";
import { colorAt } from "@/features/life-areas/colors";
import { DEFAULT_SETTINGS, type LifeArea, type Settings, type WeekStartDay } from "./types";

function migrate(raw: Partial<Settings> | null | undefined): Settings {
  const base = { ...DEFAULT_SETTINGS, ...raw };
  // Old weekly sleepHours → per-day
  if (raw && raw.sleepHoursPerDay == null && typeof raw.sleepHours === "number") {
    base.sleepHoursPerDay = Math.min(24, Math.max(0, Math.round((raw.sleepHours / 7) * 10) / 10));
  }
  if (typeof base.weekStartsOn !== "number" || base.weekStartsOn < 0 || base.weekStartsOn > 6) {
    base.weekStartsOn = 1;
  }
  // Life areas saved before colors existed get one (the default for built-ins, else by position)
  base.lifeAreas = (base.lifeAreas as (Omit<LifeArea, "color"> & { color?: string })[]).map(
    (a, i): LifeArea => ({
      ...a,
      color: a.color ?? DEFAULT_SETTINGS.lifeAreas.find((d) => d.id === a.id)?.color ?? colorAt(i),
    }),
  );
  return base as Settings;
}

export function useSettings() {
  const { data, update } = useStored<Partial<Settings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const settings = useMemo(() => migrate(data), [data]);

  const patch = useCallback(
    (p: Partial<Settings>) =>
      update((prev) => {
        const next = { ...migrate(prev), ...p };
        delete (next as Partial<Settings>).sleepHours;
        return next;
      }),
    [update],
  );

  /** Weekly sleep budget in hours */
  const weeklySleepHours = settings.sleepHoursPerDay * 7;

  return { settings, patch, weeklySleepHours };
}

export type { WeekStartDay };
