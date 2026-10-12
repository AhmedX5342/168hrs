import { useEffect, useRef, useState } from "react";
import { Check, LogOut, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/dates";
import type { Task, TaskProgress } from "@/features/tasks/types";
import { FocusBadge } from "@/features/tasks/FocusBadge";
import { useBackHandler } from "@/lib/back-button";

const EXTRA_MS = 15 * 60_000;
const AUTOSAVE_MS = 10_000;

function format(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface Props {
  task: Task;
  /** Saved progress to resume from, if any */
  initial?: TaskProgress | undefined;
  /** Persist progress (called on pause, exit, every 10s while running, and when the app is hidden) */
  onSave: (p: TaskProgress) => void;
  onComplete: () => void;
  /** Leave the timer; progress has already been saved */
  onExit: () => void;
}

export function FocusTimer({ task, initial, onSave, onComplete, onExit }: Props) {
  const [total, setTotal] = useState(() => (initial?.total ?? task.duration * 60) * 1000);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, ((initial?.total ?? task.duration * 60) - (initial?.elapsed ?? 0)) * 1000),
  );
  const [running, setRunning] = useState(true);
  const finished = remaining <= 0;

  // Refs so save callbacks (interval / page events) always see the latest values
  const live = useRef({ total, remaining });
  live.current = { total, remaining };
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const persist = () => {
    const { total: t, remaining: r } = live.current;
    onSaveRef.current({
      elapsed: Math.round((t - r) / 1000),
      total: Math.round(t / 1000),
    });
  };

  useEffect(() => {
    if (!running || finished) return;
    const endAt = Date.now() + remaining;
    const id = window.setInterval(() => setRemaining(Math.max(0, endAt - Date.now())), 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, finished]);

  // Autosave while running so an app kill / crash loses at most ~10s
  useEffect(() => {
    if (!running || finished) return;
    const id = window.setInterval(persist, AUTOSAVE_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, finished]);

  // Save when the app is backgrounded / closed (mobile)
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persist);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const R = 120;
  const C = 2 * Math.PI * R;
  const progress = 1 - remaining / total;

  const addTime = () => {
    setTotal((t) => t + EXTRA_MS);
    setRemaining((r) => r + EXTRA_MS);
    setRunning(true);
  };

  const togglePause = () => {
    if (running) persist(); // pausing saves immediately
    setRunning((r) => !r);
  };

  const saveAndExit = () => {
    persist();
    onExit();
  };

  // Android back button = "Save & exit"
  useBackHandler(() => {
    saveAndExit();
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-background px-6 animate-scale-in">
      <div className="max-w-full text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {initial ? "Picking back up" : "Locked in"}
        </p>
        <h2 className="mt-2 text-4xl [overflow-wrap:anywhere] sm:text-5xl">{task.title}</h2>
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <FocusBadge focus={task.focus} /> {formatDuration(total / 60_000)}
        </div>
      </div>

      <div className="relative size-72 sm:size-80">
        <svg viewBox="0 0 280 280" className="size-full -rotate-90">
          <circle cx="140" cy="140" r={R} className="fill-none stroke-muted" strokeWidth="10" />
          <circle
            cx="140"
            cy="140"
            r={R}
            className="fill-none stroke-primary transition-[stroke-dashoffset] duration-300 ease-linear"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {finished ? (
            <span className="font-display text-4xl text-gradient-primary">Time's up</span>
          ) : (
            <>
              <span className="font-display text-6xl tabular-nums">{format(remaining)}</span>
              <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {running ? "remaining" : "paused"}
              </span>
            </>
          )}
        </div>
      </div>

      {finished ? (
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" className="rounded-full" onClick={onComplete}>
            <Check /> Task completed
          </Button>
          <Button size="lg" variant="outline" className="rounded-full" onClick={addTime}>
            <Plus /> Add 15 min
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" className="rounded-full" onClick={onComplete}>
            <Check /> Complete
          </Button>
          <Button size="lg" variant="secondary" className="rounded-full" onClick={togglePause}>
            {running ? (
              <>
                <Pause /> Pause
              </>
            ) : (
              <>
                <Play /> Resume
              </>
            )}
          </Button>
          <Button size="lg" variant="ghost" className="rounded-full" onClick={saveAndExit}>
            <LogOut /> Save &amp; exit
          </Button>
        </div>
      )}
    </div>
  );
}
