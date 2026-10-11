import { CalendarDays, ListTodo, NotebookPen, Settings, Sun, type LucideIcon } from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon; requiresNotes?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Today", icon: Sun },
  { to: "/week", label: "Week", icon: CalendarDays },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/notes", label: "Notes", icon: NotebookPen, requiresNotes: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function visibleNavItems(notesEnabled: boolean) {
  return NAV_ITEMS.filter((i) => !i.requiresNotes || notesEnabled);
}
