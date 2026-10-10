import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDate, formatDuration, hours, todayISO } from "@/lib/dates";
import { toast } from "@/lib/toast";
import { useSettings } from "@/features/settings/use-settings";
import { useTasks } from "@/features/tasks/use-tasks";
import { blocksForDate } from "@/features/tasks/schedule";
import type { Task } from "@/features/tasks/types";
import { BlockCard } from "./BlockCard";
import { FocusTimer } from "./FocusTimer";

export function TodayView({ date }: { date: string }) {
  const { settings } = useSettings();
  const { tasks, setCompleted } = useTasks();
  const [confirm, setConfirm] = useState<Task | null>(null);
  const [active, setActive] = useState<Task | null>(null);

  const blocks = blocksForDate(tasks, date);
  const planned = blocks.reduce((s, b) => s + b.task.duration, 0);
  const done = blocks.filter((b) => b.done).reduce((s, b) => s + b.task.duration, 0);
  const isToday = date === todayISO();

  const complete = async (task: Task, value = true) => {
    await setCompleted(task.id, date, value);
    if (value) toast.success("Block completed", `${task.title} · ${formatDuration(task.duration)}`);
  };

  return (
    <>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {isToday ? `Today${settings.name ? ` · ${settings.name}` : ""}` : "Day view"}
        </p>
        <h1 className="mt-1 text-5xl sm:text-6xl">{formatDate(date, { weekday: "long" })}</h1>
        <p className="mt-1 text-muted-foreground">{formatDate(date, { day: "numeric", month: "long", year: "numeric" })}</p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Planned</div>
          <div className="font-display text-4xl">{hours(planned)}<span className="text-lg text-muted-foreground">h</span></div>
        </div>
        <div className="rounded-2xl bg-gradient-primary p-4 text-primary-foreground">
          <div className="text-xs opacity-80">Done</div>
          <div className="font-display text-4xl">{hours(done)}<span className="text-lg opacity-70">h</span></div>
        </div>
      </div>

      {blocks.length ? (
        <div className="space-y-3">
          {blocks.map((b, i) => (
            <div key={b.task.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <BlockCard block={b} onStart={() => setConfirm(b.task)} onToggle={() => complete(b.task, !b.done)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-16 text-center">
          <p className="font-display text-3xl">Nothing scheduled.</p>
          <p className="mt-2 text-muted-foreground">Plan the week.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/week"><CalendarDays /> Open week</Link></Button>
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Initialize this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirm?.title}” will take over the screen with a {confirm && formatDuration(confirm.duration)} timer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={() => setActive(confirm)}>Lock in</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {active && (
        <FocusTimer
          task={active}
          onComplete={async () => { await complete(active); setActive(null); }}
          onCancel={() => { setActive(null); toast.info("Session cancelled"); }}
        />
      )}
    </>
  );
}
