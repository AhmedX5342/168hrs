/** Time for the main arc to complete one full revolution; also the minimum time the loader shows. */
export const LOADER_REVOLUTION_MS = 1000;

/**
 * Startup loader. Uses theme tokens only, so it follows light/dark automatically
 * (main.tsx applies the saved theme before the first render).
 */
export function LoadingScreen() {
  const R = 70;
  const C = 2 * Math.PI * R;

  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="relative size-44 animate-scale-in">
        {/* soft glow */}
        <div className="absolute inset-3 rounded-full bg-primary/10 blur-xl" />

        <svg viewBox="0 0 160 160" className="absolute inset-0 size-full">
          {/* track */}
          <circle cx="80" cy="80" r={R} className="fill-none stroke-muted" strokeWidth="5" />
          {/* main arc */}
          <circle
            cx="80"
            cy="80"
            r={R}
            className="origin-center animate-spin fill-none stroke-primary"
            style={{ animationDuration: `${LOADER_REVOLUTION_MS}ms` }}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${C * 0.28} ${C}`}
          />
          {/* trailing faint arc, opposite direction */}
          <circle
            cx="80"
            cy="80"
            r={R - 9}
            className="origin-center fill-none stroke-primary/30 animate-spin [animation-direction:reverse] [animation-duration:1s]"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${C * 0.12} ${C}`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl leading-none text-gradient-primary">168</span>
          <span className="mt-1 text-xs font-semibold tracking-[0.35em] text-muted-foreground">
            HRS
          </span>
        </div>
      </div>
    </div>
  );
}
