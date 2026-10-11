import { NavLink } from "react-router-dom";
import { visibleNavItems } from "./nav-items";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/use-settings";

export function BottomNav() {
  const { settings } = useSettings();
  const items = visibleNavItems(settings.notesEnabled);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors",
              isActive && "text-primary",
            )
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
