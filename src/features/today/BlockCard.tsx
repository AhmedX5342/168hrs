import { Check, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatClock, formatDate, formatDuration, minToTime } from "@/lib/dates";
import { useSettings } from "@/features/settings/use-settings";
import { LifeAreaIcon } from "@/features/life-areas/icons";
import { FocusBadge } from "@/features/tasks/FocusBadge";
import { WeeklyBadge } from "@/features/tasks/WeeklyBadge";
import { taskAreaColor } from "@/features/tasks/task-color";
import { progressKey, type Block } from "@/features/tasks/types";

interface Props {
  block: Block;
  onStart: () => void;
  onToggle: () => void;
  /** Discard saved partial progress */
  onReset: () => void;
}

export function BlockCard({ block, onStart, onToggle, onReset }: Props) {
  const { settings } = useSettings();
  const { task, done, unscheduled } = block;
  const area = settings.lifeAreas.find((a) => a.id === task.lifeAreaId);
  const areaColor = taskAreaColor(settings.lifeAreas, task.lifeAreaId);
  const timed = !unscheduled && task.startTime;

  // Session progress (resume) + work done on this calendar day
  const prog = task.progress?.[progressKey(block)];
  const totalSec = Math.max(prog?.total ?? 0, task.duration * 60);
  const sessionElapsed = !done && prog ? Math.min(prog.elapsed, totalSec) : 0;
  const dayWorkSec = block.dayWorkSec ?? 0;
  const dayWorkMin = Math.round(dayWorkSec / 60);
  const dayPct = Math.min(100, Math.round((dayWorkSec / Math.max(1, task.duration * 60)) * 100));
  const partial = sessionElapsed > 0;
  const pct = Math.round((sessionElapsed / totalSec) * 100);
  const finishedSession = partial && sessionElapsed >= totalSec;
  const mins = (sec: number) => Math.round(sec / 60);
  const workLogOnly = !!block.workLogOnly;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-5 pl-6 transition-all sm:flex-row sm:items-center",
        done && "opacity-60",
        task.unexpected && "border-destructive/40",
        unscheduled && "border-dashed",
        block.overdue && !done && "border-focus-medium/60",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1.5", task.unexpected && "bg-destructive")}
        style={{ backgroundColor: task.unexpected ? undefined : areaColor }}
      />
      <div className="w-28 shrink-0">
        {workLogOnly ? (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Worked
            </div>
            <div className="font-display text-xl">{formatDuration(dayWorkMin)}</div>
            <div className="text-xs text-muted-foreground">of {formatDuration(task.duration)}</div>
          </>
        ) : block.overdue && task.date ? (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-destructive">
              Overdue
            </div>
            <div className="font-display text-xl">
              {formatDate(task.date, { weekday: "short", day: "numeric", month: "short" })}
            </div>
            <div className="text-xs text-muted-foreground">
              {task.startTime
                ? `was ${formatClock(task.startTime, settings.clockFormat)}`
                : formatDuration(task.duration)}
            </div>
          </>
        ) : timed ? (
          <>
            <div className="font-display text-2xl tabular-nums">
              {formatClock(minToTime(block.start), settings.clockFormat)}
            </div>
            <div className="text-xs text-muted-foreground">
              until {formatClock(minToTime(block.end), settings.clockFormat)}
            </div>
          </>
        ) : (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {unscheduled ? "Unscheduled" : task.repeat === "weekly" ? "This week" : "No time set"}
            </div>
            <div className="font-display text-xl">{formatDuration(task.duration)}</div>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "font-sans text-lg font-semibold [overflow-wrap:anywhere]",
            done && "line-through",
          )}
        >
          {task.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
            {formatDuration(task.duration)}
          </span>
          <FocusBadge focus={task.focus} />
          {task.repeat === "weekly" && <WeeklyBadge />}
          {block.overdue && !done && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-semibold text-destructive">
              Overdue
            </span>
          )}
          {partial && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
              In progress · {pct}%
            </span>
          )}
          {dayWorkSec > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              {formatDuration(dayWorkMin)} today · {dayPct}%
            </span>
          )}
          {task.unexpected && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-semibold text-destructive">
              Unexpected
            </span>
          )}
          {unscheduled && (
            <span className="rounded-full border border-dashed px-2 py-0.5 font-semibold">
              Unscheduled
            </span>
          )}
          {area && (
            <span className="flex items-center gap-1">
              <LifeAreaIcon icon={area.icon} className="size-3.5" />
              {area.name}
            </span>
          )}
        </div>
        {partial && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDuration(mins(sessionElapsed))} done ·{" "}
              {formatDuration(mins(totalSec - sessionElapsed))} left
            </p>
          </div>
        )}
        {!partial && dayWorkSec > 0 && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70 transition-all duration-500"
                style={{ width: `${dayPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDuration(dayWorkMin)} logged this day
              {done ? "" : ` · ${formatDuration(task.duration)} total`}
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {!done && (
          <Button size="sm" className="rounded-full" onClick={onStart}>
            <Play /> {finishedSession ? "Finish" : partial ? "Resume" : "Start"}
          </Button>
        )}
        {partial && (
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            aria-label="Reset progress"
            title="Reset progress"
            onClick={() => {
              if (window.confirm("Reset progress on this task and start over?")) onReset();
            }}
          >
            <RotateCcw />
          </Button>
        )}
        <Button
          size="sm"
          variant={done ? "secondary" : "outline"}
          className="rounded-full"
          onClick={onToggle}
        >
          <Check /> {done ? "Done" : "Complete"}
        </Button>
      </div>
    </div>
  );
}
