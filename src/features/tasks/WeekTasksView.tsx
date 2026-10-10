import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/PageHeader";
import { addDays, formatDate } from "@/lib/dates";
import { toast } from "@/lib/toast";
import { useWeeks } from "@/features/weeks/use-weeks";
import { useTasks } from "./use-tasks";
import { isScheduled, tasksForWeek } from "./schedule";
import { TaskCard } from "./TaskCard";
import { TaskFormDialog } from "./TaskFormDialog";
import { ScheduleDialog } from "./ScheduleDialog";
import type { Task } from "./types";

export function weekRangeLabel(start: string) {
  const end = addDays(start, 6);
  return `${formatDate(start, { day: "2-digit", month: "short" })} → ${formatDate(end, { day: "2-digit", month: "short", year: "numeric" })}`;
}

function Section({ title, tasks, empty, actions }: { title: string; tasks: Task[]; empty: string; actions: (t: Task) => React.ComponentProps<typeof TaskCard> }) {
  return (
    <section>
      <h2 className="mb-3 flex items-baseline gap-2 text-2xl">
        {title} <span className="font-sans text-sm text-muted-foreground">{tasks.length}</span>
      </h2>
      {tasks.length ? (
        <div className="grid gap-3 sm:grid-cols-2">{tasks.map((t) => <TaskCard key={t.id} {...actions(t)} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

export function WeekTasksView({ weekStart }: { weekStart: string }) {
  const { weekNumber, currentWeek } = useWeeks();
  const { tasks, deleteTask } = useTasks();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [scheduling, setScheduling] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const list = tasksForWeek(tasks, weekStart);
  const unscheduled = list.filter((t) => !isScheduled(t));
  const oneOff = list.filter((t) => t.repeat === "once" && isScheduled(t));
  const recurring = list.filter((t) => t.repeat !== "once" && isScheduled(t));

  const actions = (t: Task) => ({
    task: t,
    onEdit: () => { setEditing(t); setFormOpen(true); },
    onSchedule: () => setScheduling(t),
    onDelete: () => setDeleting(t),
  });

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link to="/tasks/weeks"><ArrowLeft /> Back to weeks</Link>
      </Button>
      <PageHeader
        eyebrow={weekStart === currentWeek ? "This week" : weekStart > currentWeek ? "Upcoming" : "Past week"}
        title={<>Week {weekNumber(weekStart) || ""} <span className="block font-sans text-base text-muted-foreground">{weekRangeLabel(weekStart)}</span></>}
        actions={<Button onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus /> New task</Button>}
      />
      <div className="space-y-10">
        <Section title="Unscheduled inventory" tasks={unscheduled} empty="Everything has a slot. Nice." actions={actions} />
        <Section title="One-off" tasks={oneOff} empty="No scheduled one-off tasks." actions={actions} />
        <Section title="Recurring" tasks={recurring} empty="No recurring tasks yet." actions={actions} />
      </div>

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} weekStart={weekStart} task={editing} />
      <ScheduleDialog task={scheduling} weekStart={weekStart} onOpenChange={(o) => !o && setScheduling(null)} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes it from every day it's scheduled on.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { if (deleting) { await deleteTask(deleting.id); toast.success("Task deleted"); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
