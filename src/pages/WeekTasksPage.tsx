import { useParams } from "react-router-dom";
import { WeekTasksView } from "@/features/tasks/WeekTasksView";

export function WeekTasksPage() {
  const { weekId } = useParams<{ weekId: string }>();
  if (!weekId) return null;
  return <WeekTasksView weekStart={weekId} />;
}
