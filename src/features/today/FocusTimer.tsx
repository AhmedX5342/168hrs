import { useEffect, useRef, useState } from "react";
import { Check, LogOut, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/dates";
import type { Task, TaskProgress } from "@/features/tasks/types";
import { FocusBadge } from "@/features/tasks/FocusBadge";
import { useBackHandler } from "@/lib/back-button";
import { useKeepAwake } from "@/lib/use-keep-awake";
import { alertTimeUp, cancelTimerEnd, scheduleTimerEnd } from "@/lib/timer-alert";

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
  initial?: TaskProgress | undefined;
  onSave: (p: TaskProgress) => void;
  onComplete: () => void;
  onExit: () => void;
}

export function FocusTimer({ task, initial, onSave, onComplete, onExit }: Props) {
  const [total, setTotal] = useState(() => (initial?.total ?? task.duration * 60) * 1000);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, ((initial?.total ?? task.duration * 60) - (initial?.elapsed ?? 0)) * 1000),
  );
  const [running, setRunning] = useState(true);
  const finished = remaining <= 0;
  const wasFinished = useRef(false);

  const live = useRef({ total, remaining });
  live.current = { total, remaining };
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useKeepAwake(running && !finished);

  const persist = () => {
    const { total: t, remaining: r } = live.current;
    onSaveRef.current({
      elapsed: Math.round((t - r) / 1000),
      total: Math.round(t / 1000),
    });
  };

  // Lock background page scroll while the timer is open (fixes long empty scroll on mobile)
  useEffect(() => {
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    // Jump viewport to top so fixed overlay aligns with visual viewport
    window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  useEffect(() => {
    if (!running || finished) return;
    const endAt = Date.now() + remaining;
    const id = window.setInterval(() => setRemaining(Math.max(0, endAt - Date.now())), 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, finished]);

  // Background notification for when the timer ends
  useEffect(() => {
    if (!running || finished) {
      void cancelTimerEnd();
      return;
    }
    void scheduleTimerEnd(task.title, remaining);
    return () => {
      void cancelTimerEnd();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, finished, total]);

  // In-app alert when countdown hits zero while open
  useEffect(() => {
    if (finished && !wasFinished.current) {
      wasFinished.current = true;
      void cancelTimerEnd();
      alertTimeUp();
    }
    if (!finished) wasFinished.current = false;
  }, [finished]);

  useEffect(() => {
    if (!running || finished) return;
    const id = window.setInterval(persist, AUTOSAVE_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, finished]);

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

  useEffect(() => () => void cancelTimerEnd(), []);

  const R = 120;
  const C = 2 * Math.PI * R;
  const progress = 1 - remaining / total;

  const addTime = () => {
    setTotal((t) => t + EXTRA_MS);
    setRemaining((r) => r + EXTRA_MS);
    setRunning(true);
  };

  const togglePause = () => {
    if (running) persist();
    setRunning((r) => !r);
  };

  const saveAndExit = () => {
    persist();
    void cancelTimerEnd();
    onExit();
  };

  useBackHandler(() => {
    saveAndExit();
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col items-center justify-center gap-6 overflow-hidden overscroll-none bg-background px-6 py-8 animate-scale-in sm:gap-10"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="max-w-full shrink-0 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {initial ? "Picking back up" : "Locked in"}
        </p>
        <h2 className="mt-2 text-3xl [overflow-wrap:anywhere] sm:text-5xl">{task.title}</h2>
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <FocusBadge focus={task.focus} /> {formatDuration(total / 60_000)}
        </div>
      </div>

      <div className="relative size-56 shrink-0 sm:size-80">
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
            <span className="font-display text-3xl text-gradient-primary sm:text-4xl">
              Time&apos;s up
            </span>
          ) : (
            <>
              <span className="font-display text-5xl tabular-nums sm:text-6xl">
                {format(remaining)}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {running ? "remaining" : "paused"}
              </span>
            </>
          )}
        </div>
      </div>

      {finished ? (
        <div className="flex shrink-0 flex-wrap justify-center gap-3">
          <Button size="lg" className="rounded-full" onClick={onComplete}>
            <Check /> Task completed
          </Button>
          <Button size="lg" variant="outline" className="rounded-full" onClick={addTime}>
            <Plus /> Add 15 min
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 flex-wrap justify-center gap-3">
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
