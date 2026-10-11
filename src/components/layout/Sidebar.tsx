import { NavLink } from "react-router-dom";
import { visibleNavItems } from "./nav-items";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/use-settings";

export function Sidebar({ name }: { name: string }) {
  const { settings } = useSettings();
  const items = visibleNavItems(settings.notesEnabled);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-5 py-8 md:flex">
      <NavLink to="/" className="mb-10 flex items-baseline gap-1 px-2">
        <span className="font-display text-4xl text-gradient-primary">168</span>
        <span className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">hrs</span>
      </NavLink>
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      {name && (
        <p className="mt-auto px-2 text-xs text-muted-foreground">
          Making the hours count, <span className="text-foreground">{name}</span>.
        </p>
      )}
    </aside>
  );
}
