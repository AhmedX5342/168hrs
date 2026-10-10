import { useSearchParams } from "react-router-dom";
import { TodayView } from "@/features/today/TodayView";
import { todayISO } from "@/lib/dates";

export function TodayPage() {
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date") ?? todayISO();
  return <TodayView date={date} />;
}
