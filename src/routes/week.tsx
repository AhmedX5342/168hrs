import { createFileRoute } from "@tanstack/react-router";
import { WeekView } from "@/features/week/WeekView";

export const Route = createFileRoute("/week")({
  head: () => ({
    meta: [
      { title: "Week — 168hrs" },
      { name: "description", content: "See all 168 hours of your week and plan your blocks." },
      { property: "og:title", content: "Week — 168hrs" },
      { property: "og:description", content: "See all 168 hours of your week and plan your blocks." },
    ],
  }),
  component: WeekView,
});
