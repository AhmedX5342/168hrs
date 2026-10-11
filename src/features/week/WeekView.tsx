import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, formatDate, formatDuration, fromISO, todayISO, weekDates } from "@/lib/dates";
import { useSettings } from "@/features/settings/use-settings";
import { useWeeks } from "@/features/weeks/use-weeks";
import { useTasks } from "@/features/tasks/use-tasks";
import {
  DAY_MIN,
  blocksForDate,
  isUnscheduled,
  isWeekly,
  occursOn,
  plannedWeekMin,
  remainingWorkMin,
  tasksForWeek,
  weeklyDoneOn,
} from "@/features/tasks/schedule";
import { taskAreaColor } from "@/features/tasks/task-color";
import { UNEXPECTED_BAR } from "@/features/tasks/types";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";
import { WeeklyBadge } from "@/features/tasks/WeeklyBadge";
import { weekRangeLabel } from "@/features/tasks/WeekTasksView";

const TOTAL_MIN = 168 * 60;

/** Whole-minute duration string, e.g. 71h 24m */
const fmt = (min: number) => formatDuration(Math.round(min));

/** Big "71h 24m" with small unit letters */
function Dur({ min, unitCls }: { min: number; unitCls?: string }) {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return (
    <>
      {h > 0 && (
        <>
          {h}
          <span className={unitCls}>h</span>{" "}
        </>
      )}
      {(r > 0 || h === 0) && (
        <>
          {r}
          <span className={unitCls}>m</span>
        </>
      )}
    </>
  );
}

export function WeekView() {
  const { settings, weeklySleepHours } = useSettings();
  const { currentWeek } = useWeeks();
  const { tasks } = useTasks();
  const [weekStart, setWeekStart] = useState(currentWeek);
  const [addDate, setAddDate] = useState<string | null>(null);
  const [unexpectedOpen, setUnexpectedOpen] = useState(false);

  // Tick every minute so "time left" stays live
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const weekDays = weekDates(weekStart);
  const days = weekDays.map((d) => ({
    date: d,
    // includeWeekly: completed weekly tasks appear on the day they were completed
    blocks: blocksForDate(tasks, d, { showUnscheduled: false, weekStart, includeWeekly: true }),
  }));
  const plannedMin = plannedWeekMin(tasks, weekStart, weekDays);
  const sleepMin = Math.round(weeklySleepHours * 60);
  const capacityMin = TOTAL_MIN - sleepMin;
  const freeMin = Math.max(0, capacityMin - plannedMin);
  const remainingMin = remainingWorkMin(tasks, weekStart, weekDays);
  const today = todayISO();

  const weeklyTasks = tasksForWeek(tasks, weekStart).filter(isWeekly);

  const areaBars = useMemo(() => {
    const weekTasks = tasksForWeek(tasks, weekStart);
    const byArea = new Map<string, number>();
    let unexpected = 0;
    let none = 0;
    const counted = new Set<string>();

    for (const t of weekTasks) {
      let min = 0;
      if (isUnscheduled(t)) {
        if (counted.has(t.id)) continue;
        counted.add(t.id);
        min = t.duration;
      } else if (isWeekly(t)) {
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

    // values are in minutes
    const bars: {
      key: string;
      label: string;
      value: number;
      cls?: string;
      style?: { backgroundColor?: string };
    }[] = [{ key: "sleep", label: "Sleep", value: sleepMin, cls: "bg-sleep" }];
    for (const area of settings.lifeAreas) {
      const v = byArea.get(area.id) ?? 0;
      if (v > 0) {
        bars.push({
          key: area.id,
          label: area.name,
          value: v,
          style: { backgroundColor: area.color },
        });
      }
    }
    if (none > 0)
      bars.push({ key: "none", label: "Other", value: none, cls: "bg-muted-foreground/40" });
    if (unexpected > 0)
      bars.push({
        key: "unexpected",
        label: "Unexpected",
        value: unexpected,
        cls: UNEXPECTED_BAR,
      });
    bars.push({ key: "free", label: "Free", value: freeMin, cls: "bg-muted-foreground/30" });
    return bars;
  }, [tasks, weekStart, weekDays, settings.lifeAreas, sleepMin, freeMin]);

  // ── Actual: minutes of tasks completed this week ──
  const completedMin = useMemo(() => {
    const days7 = weekDates(weekStart);
    const counted = new Set<string>();
    let min = 0;
    for (const t of tasksForWeek(tasks, weekStart)) {
      if (isUnscheduled(t)) {
        if (counted.has(t.id)) continue;
        counted.add(t.id);
        if (t.completions.some((c) => days7.includes(c))) min += t.duration;
      } else if (isWeekly(t)) {
        if (weeklyDoneOn(t, weekStart)) min += t.duration;
      } else {
        for (const d of days7) {
          if (occursOn(t, d) && t.completions.includes(d)) min += t.duration;
        }
      }
    }
    return min;
  }, [tasks, weekStart]);

  const remainingTaskMin = Math.max(0, plannedMin - completedMin);

  const weekStartMs = fromISO(weekStart).getTime();
  const weekEndMs = fromISO(addDays(weekStart, 7)).getTime();
  const timeLeftMin = Math.round(Math.max(0, weekEndMs - Math.max(now, weekStartMs)) / 60000);

  const spareMin = timeLeftMin - remainingTaskMin;
  const behind = spareMin < 0;
  const donePct = plannedMin > 0 ? Math.min(100, Math.round((completedMin / plannedMin) * 100)) : 0;

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

      {/* Planned card */}
      <section className="mb-6 grid gap-6 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
        <div>
          <div className="mb-2 flex items-center justify-start">
            <span className="rounded-full bg-[#d9f99d] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1f2937]">
              planned
            </span>
          </div>
          <div className="font-display text-[7rem] leading-none text-gradient-primary sm:text-[9rem]">
            168
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            hours this week · {fmt(capacityMin)} awake · {fmt(remainingMin)} work left
          </p>
        </div>
        <div className="space-y-5">
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            {areaBars.map((b) =>
              b.value > 0 ? (
                <div
                  key={b.key}
                  className={cn("h-full transition-all duration-700", b.cls)}
                  style={{ width: `${(b.value / TOTAL_MIN) * 100}%`, ...b.style }}
                  title={`${b.label}: ${fmt(b.value)}`}
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
                    <span className={cn("size-2.5 rounded-full", b.cls)} style={b.style} />
                    {b.label}
                  </div>
                  <div className="font-display text-2xl">
                    <Dur min={b.value} unitCls="text-base text-muted-foreground" />
                  </div>
                </div>
              ))}
          </div>
          <p className="text-sm">
            <span className="font-semibold">{fmt(plannedMin)}</span> planned of{" "}
            <span className="font-semibold">{fmt(capacityMin)}</span> capacity
            <span className="text-muted-foreground">
              {" "}
              · {Math.round((plannedMin / capacityMin) * 100) || 0}%
            </span>
          </p>
        </div>
      </section>

      {/* Actual card */}
      <section className="mb-10 grid gap-6 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
        <div>
          <div className="mb-2 flex items-center justify-start">
            <span className="rounded-full bg-[#bae6fd] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1f2937]">
              actual
            </span>
          </div>
          <div className="font-display text-[7rem] leading-none text-gradient-primary sm:text-[9rem]">
            <Dur min={completedMin} unitCls="text-3xl sm:text-4xl" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            task hours completed this week · {fmt(timeLeftMin)} left in the week
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-700"
              style={{ width: `${donePct}%` }}
              title={`Completed: ${fmt(completedMin)} of ${fmt(plannedMin)} planned`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="font-display text-2xl">
                <Dur min={completedMin} unitCls="text-base text-muted-foreground" />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Remaining tasks</div>
              <div className="font-display text-2xl">
                <Dur min={remainingTaskMin} unitCls="text-base text-muted-foreground" />
              </div>
            </div>
            <div>
              <div className={cn("text-xs", behind ? "text-destructive" : "text-muted-foreground")}>
                {behind ? "Behind by" : "Spare time"}
              </div>
              <div className={cn("font-display text-2xl", behind && "text-destructive")}>
                <Dur
                  min={Math.abs(spareMin)}
                  unitCls={cn("text-base", behind ? "text-destructive" : "text-muted-foreground")}
                />
              </div>
            </div>
          </div>

          <p className={cn("text-sm", behind && "text-destructive")}>
            {behind ? (
              <>
                <span className="font-semibold">You're behind:</span> {fmt(remainingTaskMin)} of
                tasks left but only {fmt(timeLeftMin)} remain this week
              </>
            ) : (
              <>
                <span className="font-semibold">{donePct}%</span> of planned work done
                <span className="text-muted-foreground">
                  {" "}
                  · {fmt(timeLeftMin)} left − {fmt(remainingTaskMin)} tasks = {fmt(spareMin)} spare
                </span>
              </>
            )}
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map(({ date, blocks }) => {
          // Weekly tasks aren't tied to a day, so they don't count toward the day's 24h
          const total = blocks.filter((b) => !b.weekly).reduce((s, b) => s + b.task.duration, 0);
          const full = total >= DAY_MIN;
          return (
            <div
              key={date}
              className={cn(
                "flex min-h-40 flex-col rounded-2xl border bg-card p-3",
                date === today && "ring-2 ring-primary",
                full && "border-destructive/40",
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
                  <div className="text-xs text-muted-foreground">
                    {full && (
                      <span className="mr-1 font-semibold uppercase text-destructive">Full ·</span>
                    )}
                    {fmt(total)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Add block"
                    disabled={full}
                    title={full ? "This day is full (24h)" : undefined}
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
                        b.task.unexpected && UNEXPECTED_BAR,
                      )}
                      style={{
                        backgroundColor: b.task.unexpected
                          ? undefined
                          : taskAreaColor(settings.lifeAreas, b.task.lifeAreaId),
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{b.task.title}</span>
                    {b.weekly && <WeeklyBadge short className="px-1.5 text-[10px]" />}
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

      {/* Weekly tasks: every weekly task for this week, done or not */}
      <section className="mt-10">
        <h2 className="mb-3 flex items-baseline gap-2 text-2xl">
          Weekly tasks{" "}
          <span className="font-sans text-sm text-muted-foreground">{weeklyTasks.length}</span>
        </h2>
        {weeklyTasks.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {weeklyTasks.map((t) => {
              const doneOn = weeklyDoneOn(t, weekStart);
              return (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-card p-3 text-sm",
                    doneOn && "opacity-70",
                  )}
                >
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: taskAreaColor(settings.lifeAreas, t.lifeAreaId) }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate font-semibold", doneOn && "line-through")}>
                      {t.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <WeeklyBadge short />
                      <span>{formatDuration(t.duration)}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold",
                      doneOn ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {doneOn
                      ? `Done · ${formatDate(doneOn, { weekday: "short", day: "numeric", month: "short" })}`
                      : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No weekly tasks.
          </p>
        )}
      </section>

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
