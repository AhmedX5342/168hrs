import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TodayView } from "@/features/today/TodayView";
import { todayISO } from "@/lib/dates";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ date: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Today — 168hrs" },
      { name: "description", content: "Your time blocks for today. Lock in and get them done." },
      { property: "og:title", content: "Today — 168hrs" },
      { property: "og:description", content: "Your time blocks for today. Lock in and get them done." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { date } = Route.useSearch();
  return <TodayView date={date ?? todayISO()} />;
}
