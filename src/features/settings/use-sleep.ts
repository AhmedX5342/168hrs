import { useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";
import { sleepDurationMin, todayISO } from "@/lib/dates";
import { useSettings } from "@/features/settings/use-settings";
import type { SleepLog } from "./types";

export function useSleep() {
  const { settings } = useSettings();
  const { data: logs, update } = useStored<SleepLog[]>(STORAGE_KEYS.sleepLogs, []);

  const today = todayISO();
  const todayLog = useMemo(() => logs.find((l) => l.date === today), [logs, today]);

  const logWake = useCallback(
    (wokeAt: string, bedAt?: string) =>
      update((prev) => {
        const rest = prev.filter((l) => l.date !== today);
        return [...rest, { date: today, wokeAt, bedAt: bedAt ?? settings.sleepBedtime }];
      }),
    [update, today, settings.sleepBedtime],
  );

  const actualSleepMin = todayLog
    ? sleepDurationMin(todayLog.bedAt ?? settings.sleepBedtime, todayLog.wokeAt)
    : null;

  const targetSleepMin = sleepDurationMin(settings.sleepBedtime, settings.sleepWakeTarget);
  const idealMin = settings.idealSleepHours * 60;
  const wastedMin = actualSleepMin != null ? Math.max(0, actualSleepMin - idealMin) : 0;

  return {
    logs,
    todayLog,
    needsWakeLog: !todayLog,
    logWake,
    actualSleepMin,
    targetSleepMin,
    wastedMin,
    idealMin,
  };
}
