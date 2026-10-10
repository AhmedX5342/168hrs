import { createFileRoute } from "@tanstack/react-router";
import { WeekTasksView } from "@/features/tasks/WeekTasksView";
import { useWeeks } from "@/features/weeks/use-weeks";

export const Route = createFileRoute("/tasks/")({
  head: () => ({
    meta: [
      { title: "Tasks — 168hrs" },
      { name: "description", content: "Your task library for this week: one-off and recurring." },
      { property: "og:title", content: "Tasks — 168hrs" },
      { property: "og:description", content: "Your task library for this week: one-off and recurring." },
    ],
  }),
  component: CurrentWeekTasks,
});

function CurrentWeekTasks() {
  const { currentWeek } = useWeeks();
  return <WeekTasksView weekStart={currentWeek} />;
}
