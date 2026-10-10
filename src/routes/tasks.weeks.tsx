import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useWeeks } from "@/features/weeks/use-weeks";
import { weekRangeLabel } from "@/features/tasks/WeekTasksView";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/tasks/weeks")({
  head: () => ({
    meta: [
      { title: "Weeks — 168hrs" },
      { name: "description", content: "Browse past, current and upcoming weeks." },
      { property: "og:title", content: "Weeks — 168hrs" },
      { property: "og:description", content: "Browse past, current and upcoming weeks." },
    ],
  }),
  component: WeeksPage,
});

function WeeksPage() {
  const { weeks, currentWeek, createUpcomingWeek } = useWeeks();
  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Weeks"
        actions={<Button onClick={async () => { await createUpcomingWeek(); toast.success("Upcoming week created"); }}><Plus /> Plan upcoming week</Button>}
      />
      <div className="space-y-2">
        {[...weeks].reverse().map((w) => (
          <Link key={w} to="/tasks/$weekId" params={{ weekId: w }} className="flex items-center justify-between rounded-2xl border bg-card p-4 transition-shadow hover:shadow-soft">
            <div>
              <div className="font-display text-2xl">Week {weeks.indexOf(w) + 1}</div>
              <div className="text-sm text-muted-foreground">{weekRangeLabel(w)}</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              {w === currentWeek ? "Current" : w > currentWeek ? "Upcoming" : ""}
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
