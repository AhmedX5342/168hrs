import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, weekDates } from "@/lib/dates";
import { toast } from "@/lib/toast";
import { useTasks } from "./use-tasks";
import { DAY_MIN, dayLoadMin, firstFullDay } from "./schedule";
import type { Task } from "./types";

export function ScheduleDialog({
  task,
  weekStart,
  onOpenChange,
}: {
  task: Task | null;
  weekStart: string;
  onOpenChange: (o: boolean) => void;
}) {
  const { tasks, updateTask } = useTasks();
  const dates = weekDates(weekStart);
  const [date, setDate] = useState<string>(dates[0] ?? weekStart);
  const [time, setTime] = useState("");

  useEffect(() => {
    if (task) {
      setDate(task.date ?? dates[0] ?? weekStart);
      setTime(task.startTime ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  if (!task) return null;
  const once = task.repeat === "once";

  const save = async () => {
    const full = firstFullDay(tasks, { ...task, date: once ? date : task.date }, task.id);
    if (full) {
      toast.error(
        "That day is full",
        `${formatDate(full, { weekday: "long", day: "numeric", month: "short" })} already has 24h scheduled.`,
      );
      return;
    }
    await updateTask(task.id, { startTime: time || null, ...(once ? { date } : {}) });
    toast.success("Scheduled", task.title);
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Schedule</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{task.title}</p>
        <div className="space-y-4">
          {once && (
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select value={date} onValueChange={setDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dates.map((d) => {
                    const full = dayLoadMin(tasks, d, task.id) + task.duration > DAY_MIN;
                    return (
                      <SelectItem key={d} value={d} disabled={full}>
                        {formatDate(d, { weekday: "long", day: "2-digit", month: "short" })}
                        {full ? " — full" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Start time (optional)</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
