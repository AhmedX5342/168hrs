import { createFileRoute } from "@tanstack/react-router";
import { WeekTasksView } from "@/features/tasks/WeekTasksView";

export const Route = createFileRoute("/tasks/$weekId")({
  head: () => ({
    meta: [
      { title: "Week tasks — 168hrs" },
      { name: "description", content: "Plan the tasks for a specific week." },
      { property: "og:title", content: "Week tasks — 168hrs" },
      { property: "og:description", content: "Plan the tasks for a specific week." },
    ],
  }),
  component: WeekTasksPage,
});

function WeekTasksPage() {
  const { weekId } = Route.useParams();
  return <WeekTasksView weekStart={weekId} />;
}
