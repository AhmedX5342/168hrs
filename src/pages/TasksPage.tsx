import { WeekTasksView } from "@/features/tasks/WeekTasksView";
import { useWeeks } from "@/features/weeks/use-weeks";

export function TasksPage() {
  const { currentWeek } = useWeeks();
  return <WeekTasksView weekStart={currentWeek} />;
}
