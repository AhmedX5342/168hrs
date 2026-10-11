import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

export function WeeklyBadge({ short = false, className }: { short?: boolean; className?: string }) {
  return (
    <span
      title="Weekly: can be done any time during the week"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary",
        className,
      )}
    >
      <Repeat className="size-3" />
      {short ? "Weekly" : "Weekly · anytime this week"}
    </span>
  );
}
