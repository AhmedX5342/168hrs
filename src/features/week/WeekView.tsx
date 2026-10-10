import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, formatDate, formatDuration, hours, todayISO, weekDates } from "@/lib/dates";
import { useSettings } from "@/features/settings/use-settings";
import { useWeeks } from "@/features/weeks/use-weeks";
import { useTasks } from "@/features/tasks/use-tasks";
import { blocksForDate } from "@/features/tasks/schedule";
import { FOCUS_BG } from "@/features/tasks/FocusBadge";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";
import { weekRangeLabel } from "@/features/tasks/WeekTasksView";

const TOTAL = 168;

export function WeekView() {
  const { settings } = useSettings();
  const { currentWeek } = useWeeks();
  const { tasks } = useTasks();
  const [weekStart, setWeekStart] = useState(currentWeek);
  const [addDate, setAddDate] = useState<string | null>(null);

  const days = weekDates(weekStart).map((d) => ({ date: d, blocks: blocksForDate(tasks, d) }));
  const plannedH = hours(days.reduce((s, d) => s + d.blocks.reduce((a, b) => a + b.task.duration, 0), 0));
  const sleep = settings.sleepHours;
  const capacity = TOTAL - sleep;
  const free = Math.max(0, capacity - plannedH);
  const today = todayISO();

  const bars = [
    { label: "Sleep / fixed", value: sleep, cls: "bg-sleep" },
    { label: "Planned", value: plannedH, cls: "bg-primary" },
    { label: "Free", value: free, cls: "bg-muted-foreground/30" },
  ];

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The 168 view</p>
          <p className="mt-1 text-sm text-muted-foreground">{weekRangeLabel(weekStart)}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(currentWeek)}>This week</Button>
          <Button variant="outline" size="icon" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight /></Button>
        </div>
      </div>

      <section className="mb-10 grid gap-6 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
        <div>
          <div className="font-display text-[7rem] leading-none text-gradient-primary sm:text-[9rem]">168</div>
          <p className="mt-2 text-sm text-muted-foreground">hours this week · {capacity}h awake capacity</p>
        </div>
        <div className="space-y-5">
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            {bars.map((b) => (
              <div key={b.label} className={cn("h-full transition-all duration-700", b.cls)} style={{ width: `${(b.value / TOTAL) * 100}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={cn("size-2.5 rounded-full", b.cls)} />{b.label}</div>
                <div className="font-display text-3xl">{b.value}<span className="text-base text-muted-foreground">h</span></div>
              </div>
            ))}
          </div>
          <p className="text-sm">
            <span className="font-semibold">{plannedH}h</span> planned of <span className="font-semibold">{capacity}h</span> capacity
            <span className="text-muted-foreground"> · {Math.round((plannedH / capacity) * 100) || 0}%</span>
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map(({ date, blocks }) => {
          const total = blocks.reduce((s, b) => s + b.task.duration, 0);
          return (
            <div key={date} className={cn("flex min-h-40 flex-col rounded-2xl border bg-card p-3", date === today && "ring-2 ring-primary")}>
              <div className="mb-3 flex items-start justify-between">
                <Link to="/" search={{ date }} className="group">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary">{formatDate(date, { weekday: "short" })}</div>
                  <div className="font-display text-2xl">{formatDate(date, { day: "numeric" })}</div>
                </Link>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{hours(total)}h</div>
                  <Button variant="ghost" size="icon" className="size-7" aria-label="Add block" onClick={() => setAddDate(date)}><Plus /></Button>
                </div>
              </div>
              <Link to="/" search={{ date }} className="flex flex-1 flex-col gap-1.5">
                {blocks.map((b) => (
                  <div key={b.task.id} className={cn("flex items-center gap-2 rounded-lg bg-secondary px-2 py-1.5 text-xs", b.done && "opacity-50 line-through")}>
                    <span className={cn("h-full min-h-4 w-1 shrink-0 rounded-full", FOCUS_BG[b.task.focus])} />
                    <span className="min-w-0 flex-1 truncate font-medium">{b.task.title}</span>
                    <span className="text-muted-foreground">{formatDuration(b.task.duration)}</span>
                  </div>
                ))}
                {!blocks.length && <span className="m-auto text-xs text-muted-foreground">Free day</span>}
              </Link>
            </div>
          );
        })}
      </div>

      <TaskFormDialog open={!!addDate} onOpenChange={(o) => !o && setAddDate(null)} weekStart={weekStart} defaultDate={addDate ?? undefined} />
    </>
  );
}
