import { Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration, minToTime } from "@/lib/dates";
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
  const { task, done } = block;
  const area = settings.lifeAreas.find((a) => a.id === task.lifeAreaId);

  return (
    <div className={cn("relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-5 pl-6 transition-all sm:flex-row sm:items-center", done && "opacity-60")}>
      <span className={cn("absolute inset-y-0 left-0 w-1.5", FOCUS_BG[task.focus])} />
      <div className="w-28 shrink-0">
        <div className="font-display text-2xl tabular-nums">{minToTime(block.start)}</div>
        <div className="text-xs text-muted-foreground">until {minToTime(block.end)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={cn("font-sans text-lg font-semibold", done && "line-through")}>{task.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">{formatDuration(task.duration)}</span>
          <FocusBadge focus={task.focus} />
          {area && <span className="flex items-center gap-1"><LifeAreaIcon icon={area.icon} className="size-3.5" />{area.name}</span>}
        </div>
      </div>
      <div className="flex gap-2">
        {!done && <Button size="sm" className="rounded-full" onClick={onStart}><Play /> Start</Button>}
        <Button size="sm" variant={done ? "secondary" : "outline"} className="rounded-full" onClick={onToggle}>
          <Check /> {done ? "Done" : "Complete"}
        </Button>
      </div>
    </div>
  );
}
