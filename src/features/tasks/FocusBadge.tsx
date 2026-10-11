import { cn } from "@/lib/utils";
import { FOCUS_LABEL, type Focus } from "./types";

const LEVEL: Record<Focus, number> = { deep: 3, medium: 2, light: 1 };

export const FOCUS_BG: Record<Focus, string> = {
  deep: "bg-focus-deep",
  medium: "bg-focus-medium",
  light: "bg-focus-light",
};

/** Neutral focus-level indicator (task colors now come from the life area). */
export function FocusBadge({ focus, className }: { focus: Focus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "w-0.5 rounded-full",
              i === 1 ? "h-1.5" : i === 2 ? "h-2" : "h-2.5",
              i <= LEVEL[focus] ? "bg-foreground/70" : "bg-muted-foreground/30",
            )}
          />
        ))}
      </span>
      {FOCUS_LABEL[focus]}
    </span>
  );
}
