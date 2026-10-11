import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, formatDate, formatDuration, hours, todayISO, weekDates } from "@/lib/dates";
import { useSettings } from "@/features/settings/use-settings";
import { useWeeks } from "@/features/weeks/use-weeks";
import { useTasks } from "@/features/tasks/use-tasks";
import {
  blocksForDate,
  occursOn,
  plannedWeekMin,
  remainingWorkMin,
  tasksForWeek,
} from "@/features/tasks/schedule";
import { FOCUS_BG } from "@/features/tasks/FocusBadge";
import { LIFE_AREA_COLORS, UNEXPECTED_BAR } from "@/features/tasks/types";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";
import { weekRangeLabel } from "@/features/tasks/WeekTasksView";

const TOTAL = 168;

export function WeekView() {
  const { settings, weeklySleepHours } = useSettings();
  const { currentWeek } = useWeeks();
  const { tasks } = useTasks();
  const [weekStart, setWeekStart] = useState(currentWeek);
  const [addDate, setAddDate] = useState<string | null>(null);
  const [unexpectedOpen, setUnexpectedOpen] = useState(false);

  const weekDays = weekDates(weekStart);
  const days = weekDays.map((d) => ({
    date: d,
    blocks: blocksForDate(tasks, d, { showUnscheduled: false, weekStart }),
  }));
  const plannedH = hours(plannedWeekMin(tasks, weekStart, weekDays));
  const sleep = weeklySleepHours;
  const capacity = TOTAL - sleep;
  const free = Math.max(0, capacity - plannedH);
  const remainingH = hours(remainingWorkMin(tasks, weekStart, weekDays));
  const today = todayISO();

  const areaBars = useMemo(() => {
    const weekTasks = tasksForWeek(tasks, weekStart);
    const byArea = new Map<string, number>();
    let unexpected = 0;
    let none = 0;
    const counted = new Set<string>();

    for (const t of weekTasks) {
      let min = 0;
      if (t.openEnded || (t.repeat === "once" && (!t.date || !t.startTime))) {
        if (counted.has(t.id)) continue;
        counted.add(t.id);
        min = t.duration;
      } else {
        for (const d of weekDays) {
          if (occursOn(t, d)) min += t.duration;
        }
      }
      if (t.unexpected) unexpected += min;
      else if (t.lifeAreaId) byArea.set(t.lifeAreaId, (byArea.get(t.lifeAreaId) ?? 0) + min);
      else none += min;
    }

    const bars: { key: string; label: string; value: number; cls: string }[] = [
      { key: "sleep", label: "Sleep", value: sleep, cls: "bg-sleep" },
    ];
    let i = 0;
    for (const area of settings.lifeAreas) {
      const v = hours(byArea.get(area.id) ?? 0);
      if (v > 0) {
        bars.push({
          key: area.id,
          label: area.name,
          value: v,
          cls: LIFE_AREA_COLORS[i % LIFE_AREA_COLORS.length]!,
        });
        i++;
      }
    }
    if (none > 0)
      bars.push({ key: "none", label: "Other", value: hours(none), cls: "bg-muted-foreground/40" });
    if (unexpected > 0)
      bars.push({
        key: "unexpected",
        label: "Unexpected",
        value: hours(unexpected),
        cls: UNEXPECTED_BAR,
      });
    bars.push({ key: "free", label: "Free", value: free, cls: "bg-muted-foreground/30" });
    return bars;
  }, [tasks, weekStart, weekDays, settings.lifeAreas, sleep, free]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            The 168 view
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{weekRangeLabel(weekStart)}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button variant="outline" size="sm" onClick={() => setUnexpectedOpen(true)}>
            + Unexpected
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous week"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(currentWeek)}>
            This week
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next week"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <section className="mb-10 grid gap-6 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
        <div>
          <div className="font-display text-[7rem] leading-none text-gradient-primary sm:text-[9rem]">
            168
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            hours this week · {capacity}h awake · {remainingH}h work left
          </p>
        </div>
        <div className="space-y-5">
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            {areaBars.map((b) =>
              b.value > 0 ? (
                <div
                  key={b.key}
                  className={cn("h-full transition-all duration-700", b.cls)}
                  style={{ width: `${(b.value / TOTAL) * 100}%` }}
                  title={`${b.label}: ${b.value}h`}
                />
              ) : null,
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {areaBars
              .filter((b) => b.value > 0)
              .map((b) => (
                <div key={b.key}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("size-2.5 rounded-full", b.cls)} />
                    {b.label}
                  </div>
                  <div className="font-display text-2xl">
                    {b.value}
                    <span className="text-base text-muted-foreground">h</span>
                  </div>
                </div>
              ))}
          </div>
          <p className="text-sm">
            <span className="font-semibold">{plannedH}h</span> planned of{" "}
            <span className="font-semibold">{capacity}h</span> capacity
            <span className="text-muted-foreground">
              {" "}
              · {Math.round((plannedH / capacity) * 100) || 0}%
            </span>
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map(({ date, blocks }) => {
          const total = blocks.reduce((s, b) => s + b.task.duration, 0);
          return (
            <div
              key={date}
              className={cn(
                "flex min-h-40 flex-col rounded-2xl border bg-card p-3",
                date === today && "ring-2 ring-primary",
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDate(date, { weekday: "short" })}
                  </div>
                  <div className="font-display text-2xl">
                    {formatDate(date, { day: "numeric" })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{hours(total)}h</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Add block"
                    onClick={() => setAddDate(date)}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {blocks.map((b) => (
                  <div
                    key={b.task.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg bg-secondary px-2 py-1.5 text-xs",
                      b.done && "opacity-50 line-through",
                      b.task.unexpected && "ring-1 ring-destructive/40",
                    )}
                  >
                    <span
                      className={cn(
                        "h-full min-h-4 w-1 shrink-0 rounded-full",
                        b.task.unexpected ? UNEXPECTED_BAR : FOCUS_BG[b.task.focus],
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{b.task.title}</span>
                    <span className="text-muted-foreground">{formatDuration(b.task.duration)}</span>
                  </div>
                ))}
                {!blocks.length && (
                  <span className="m-auto text-xs text-muted-foreground">Free day</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormDialog
        open={!!addDate}
        onOpenChange={(o) => !o && setAddDate(null)}
        weekStart={weekStart}
        defaultDate={addDate ?? undefined}
      />
      <TaskFormDialog
        open={unexpectedOpen}
        onOpenChange={setUnexpectedOpen}
        weekStart={weekStart}
        defaultDate={today}
        unexpected
      />
    </>
  );
}
