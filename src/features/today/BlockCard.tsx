import { Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatClock, formatDuration, minToTime } from "@/lib/dates";
import { useSettings } from "@/features/settings/use-settings";
import { LifeAreaIcon } from "@/features/life-areas/icons";
import { FOCUS_BG, FocusBadge } from "@/features/tasks/FocusBadge";
import type { Block } from "@/features/tasks/types";

interface Props {
  block: Block;
  onStart: () => void;
  onToggle: () => void;
}

export function BlockCard({ block, onStart, onToggle }: Props) {
  const { settings } = useSettings();
  const { task, done, unscheduled } = block;
  const area = settings.lifeAreas.find((a) => a.id === task.lifeAreaId);
  const timed = !unscheduled && task.startTime;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-5 pl-6 transition-all sm:flex-row sm:items-center",
        done && "opacity-60",
        task.unexpected && "border-destructive/40",
        unscheduled && "border-dashed",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          task.unexpected ? "bg-destructive" : FOCUS_BG[task.focus],
        )}
      />
      <div className="w-28 shrink-0">
        {timed ? (
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
              {task.openEnded ? "Open-ended" : "Unscheduled"}
            </div>
            <div className="font-display text-xl">{formatDuration(task.duration)}</div>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={cn("font-sans text-lg font-semibold", done && "line-through")}>
          {task.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
            {formatDuration(task.duration)}
          </span>
          <FocusBadge focus={task.focus} />
          {task.unexpected && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-semibold text-destructive">
              Unexpected
            </span>
          )}
          {task.openEnded && (
            <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
              Any day
            </span>
          )}
          {unscheduled && !task.openEnded && (
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
      </div>
      <div className="flex gap-2">
        {!done && timed && (
          <Button size="sm" className="rounded-full" onClick={onStart}>
            <Play /> Start
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
