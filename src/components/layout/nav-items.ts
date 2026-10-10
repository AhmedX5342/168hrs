import { CalendarDays, ListTodo, Settings, Sun } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Today", icon: Sun },
  { to: "/week", label: "Week", icon: CalendarDays },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
