import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarDays, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatDuration, todayISO, weekDates, startOfWeek } from "@/lib/dates";
import { toast } from "@/lib/toast";
import { useSettings } from "@/features/settings/use-settings";
import { useTasks } from "@/features/tasks/use-tasks";
import { blocksForDate, remainingWorkMin } from "@/features/tasks/schedule";
import { progressKey, type Block, type Task } from "@/features/tasks/types";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";
import { BlockCard } from "./BlockCard";
import { FocusTimer } from "./FocusTimer";
import { LiveClock } from "./LiveClock";
import { useSleep } from "../settings/use-sleep";

/** A focus session: the task plus the key its progress is saved under. */
type Session = { task: Task; key: string };

/** Whole-minute duration string, e.g. 71h 24m */
const fmt = (min: number) => formatDuration(Math.round(min));

/** "3h 20m" with small unit letters */
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

export function TodayView({ date }: { date: string }) {
  const { settings, weeklySleepHours } = useSettings();
  const { tasks, setCompleted, updateTask, setProgress } = useTasks();
  const sleep = useSleep();
  const [confirm, setConfirm] = useState<Session | null>(null);
  const [active, setActive] = useState<Session | null>(null);
  const [wakeInput, setWakeInput] = useState(settings.sleepWakeTarget);
  const [unexpectedOpen, setUnexpectedOpen] = useState(false);

  const weekStart = startOfWeek(date, settings.weekStartsOn);
  const weekDays = weekDates(weekStart);
  const isToday = date === todayISO();
  const blocks = blocksForDate(tasks, date, {
    showUnscheduled: settings.showUnscheduled,
    weekStart,
    includeOverdue: isToday,
  });
  const planned = blocks.reduce((s, b) => s + b.task.duration, 0);
  const done = blocks.filter((b) => b.done).reduce((s, b) => s + b.task.duration, 0);

  const remainingMin = remainingWorkMin(tasks, weekStart, weekDays);
  const capacityMin = Math.round((168 - weeklySleepHours) * 60);
  const spareMin = capacityMin - remainingMin;
  const lowSpare = spareMin < 3 * 60 && spareMin > 0;
  const critical = remainingMin >= capacityMin;

  const resumeInfo = confirm?.task.progress?.[confirm.key];

  const complete = async (task: Task, key: string, value = true) => {
    if (!value && task.repeat === "once") {
      // A one-time task may have been finished on another day — un-complete it fully
      await updateTask(task.id, { completions: [] });
    } else {
      await setCompleted(task.id, date, value);
    }
    if (value) await setProgress(task.id, key, null); // finished — nothing left to resume
    if (value) toast.success("Block completed", `${task.title} · ${formatDuration(task.duration)}`);
  };

  const incompleteBlocks = blocks.filter((b) => !b.done);
  const completedBlocks = blocks.filter((b) => b.done);

  const renderBlock = (b: Block, i: number) => (
    <div
      key={`${b.task.id}-${b.unscheduled ? "u" : "s"}`}
      className="animate-fade-up"
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <BlockCard
        block={b}
        onStart={() => setConfirm({ task: b.task, key: progressKey(b) })}
        onToggle={() => complete(b.task, progressKey(b), !b.done)}
        onReset={() => void setProgress(b.task.id, progressKey(b), null)}
      />
    </div>
  );

  const submitWake = async () => {
    await sleep.logWake(wakeInput);
    toast.success("Wake time logged");
  };

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {isToday ? `Today${settings.name ? ` · ${settings.name}` : ""}` : "Day view"}
          </p>
          <h1 className="mt-1 text-5xl sm:text-6xl">{formatDate(date, { weekday: "long" })}</h1>
          <p className="mt-1 text-muted-foreground">
            {formatDate(date, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">{isToday && <LiveClock />}</div>
      </header>

      {isToday && sleep.todayLog && sleep.actualSleepMin != null && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm">
          <Moon className="size-4 text-sleep" />
          <span>
            Slept <strong>{formatDuration(sleep.actualSleepMin)}</strong>
            {sleep.wastedMin > 0 && (
              <span className="text-muted-foreground">
                {" "}
                ·{" "}
                <span className="text-destructive font-medium">
                  {formatDuration(sleep.wastedMin)} over ideal
                </span>
              </span>
            )}
          </span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-lg sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Planned today</div>
          <div className="font-display text-3xl">
            <Dur min={planned} unitCls="text-lg text-muted-foreground" />
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-primary p-4 text-primary-foreground">
          <div className="text-xs opacity-80">Done</div>
          <div className="font-display text-3xl">
            <Dur min={done} unitCls="text-lg opacity-70" />
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setUnexpectedOpen(true)}>
          + Unexpected
        </Button>
      </div>

      {critical && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Overloaded week</p>
            <p className="mt-1 text-muted-foreground">
              Remaining work ({fmt(remainingMin)}) meets or exceeds awake capacity (
              {fmt(capacityMin)}). Choose priorities — drop, defer, or shorten lower-value tasks.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to="/tasks">Review tasks</Link>
            </Button>
          </div>
        </div>
      )}
      {!critical && lowSpare && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-focus-medium/40 bg-focus-medium/10 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-focus-medium" />
          <div>
            <p className="font-semibold">Low spare time</p>
            <p className="mt-1 text-muted-foreground">
              Under 3h buffer left this week. Unexpected work will push you over capacity.
            </p>
          </div>
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-16 text-center">
          <p className="font-display text-3xl">Nothing scheduled.</p>
          <p className="mt-2 text-muted-foreground">Plan the week.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/week">
              <CalendarDays /> Open week
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 flex items-baseline gap-2 text-2xl">
              Incomplete{" "}
              <span className="font-sans text-sm text-muted-foreground">
                {incompleteBlocks.length}
              </span>
            </h2>
            {incompleteBlocks.length ? (
              <div className="space-y-3">{incompleteBlocks.map(renderBlock)}</div>
            ) : (
              <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Everything here is done. Nice.
              </p>
            )}
          </section>
          {completedBlocks.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-baseline gap-2 text-2xl">
                Completed{" "}
                <span className="font-sans text-sm text-muted-foreground">
                  {completedBlocks.length}
                </span>
              </h2>
              <div className="space-y-3">{completedBlocks.map(renderBlock)}</div>
            </section>
          )}
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resumeInfo ? "Resume this task?" : "Initialize this task?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resumeInfo
                ? `“${confirm?.task.title}” picks up where you left off — ${formatDuration(
                    Math.ceil(Math.max(0, resumeInfo.total - resumeInfo.elapsed) / 60),
                  )} remaining.`
                : `“${confirm?.task.title}” will take over the screen with a ${
                    confirm ? formatDuration(confirm.task.duration) : ""
                  } timer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={() => setActive(confirm)}>
              {resumeInfo ? "Resume" : "Lock in"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {active && (
        <FocusTimer
          task={active.task}
          initial={active.task.progress?.[active.key]}
          onSave={(p) => void setProgress(active.task.id, active.key, p)}
          onComplete={async () => {
            await complete(active.task, active.key);
            setActive(null);
          }}
          onExit={() => {
            setActive(null);
            toast.info("Progress saved", "Resume anytime from Today.");
          }}
        />
      )}

      <TaskFormDialog
        open={unexpectedOpen}
        onOpenChange={setUnexpectedOpen}
        weekStart={weekStart}
        defaultDate={date}
        unexpected
      />

      <Dialog open={isToday && sleep.needsWakeLog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">
              When did you wake up?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Target: {settings.sleepBedtime} → {settings.sleepWakeTarget} (
            {formatDuration(sleep.targetSleepMin)}). Anything over {settings.idealSleepHours}h
            counts as wasted sleep.
          </p>
          <div className="space-y-1.5">
            <Label>Actual wake time</Label>
            <Input type="time" value={wakeInput} onChange={(e) => setWakeInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={() => void submitWake()}>Log wake</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
