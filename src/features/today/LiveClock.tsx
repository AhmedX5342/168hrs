import { useEffect, useState } from "react";
import { formatClock } from "@/lib/dates";
import { useSettings } from "@/features/settings/use-settings";

export function LiveClock({ className }: { className?: string }) {
  const { settings } = useSettings();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const mins = now.getHours() * 60 + now.getMinutes();
  // const secs = String(now.getSeconds()).padStart(2, "0");
  const label = formatClock(mins, settings.clockFormat);

  return (
    <time
      dateTime={now.toISOString()}
      className={
        className ?? "font-display text-3xl tabular-nums tracking-tight text-primary sm:text-4xl"
      }
    >
      {label}
      {/* <span className="ml-1 text-base text-muted-foreground">:{secs}</span> */}
    </time>
  );
}
