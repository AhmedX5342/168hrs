import { CalendarClock, MoreVertical, Pencil, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DAY_SHORT, formatDate, formatDuration } from "@/lib/dates";
import { useSettings } from "@/features/settings/use-settings";
import { LifeAreaIcon } from "@/features/life-areas/icons";
import { FocusBadge } from "./FocusBadge";
import { isScheduled } from "./schedule";
import type { Task } from "./types";

function repeatLabel(t: Task) {
  if (t.repeat === "daily") return "Daily";
  if (t.repeat === "weekdays") return "Weekdays";
  if (t.repeat === "days") return [...t.days].sort().map((d) => DAY_SHORT[d]).join(", ");
  return t.date ? formatDate(t.date, { weekday: "short", day: "2-digit", month: "short" }) : null;
}

interface Props {
  task: Task;
  onEdit: () => void;
  onSchedule: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onEdit, onSchedule, onDelete }: Props) {
  const { settings } = useSettings();
  const area = settings.lifeAreas.find((a) => a.id === task.lifeAreaId);
  const scheduled = isScheduled(task);
  const when = repeatLabel(task);

  return (
    <div className="group flex items-start gap-3 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-soft">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <LifeAreaIcon icon={area?.icon} className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-sans text-base font-semibold">{task.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 -mt-1 size-8" aria-label="Task actions"><MoreVertical /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSchedule}><CalendarClock /> Schedule</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}><Pencil /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{formatDuration(task.duration)}</span>
          <FocusBadge focus={task.focus} />
          {area && <span>{area.name}</span>}
          {task.repeat !== "once" && <Repeat className="size-3" />}
          {when && <span>{when}</span>}
          {task.startTime && <span>· {task.startTime}</span>}
        </div>
        {task.notes && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{task.notes}</p>}
        {!scheduled && (
          <Button variant="outline" size="sm" className="mt-3 h-8" onClick={onSchedule}>
            <CalendarClock /> Schedule
          </Button>
        )}
      </div>
    </div>
  );
}
