import { cn } from "@/lib/utils";
import { FOCUS_LABEL, type Focus } from "./types";

export const FOCUS_BG: Record<Focus, string> = {
  deep: "bg-focus-deep",
  medium: "bg-focus-medium",
  light: "bg-focus-light",
};

export function FocusBadge({ focus, className }: { focus: Focus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", FOCUS_BG[focus])} />
      {FOCUS_LABEL[focus]}
    </span>
  );
}
