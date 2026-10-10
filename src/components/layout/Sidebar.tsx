import { Link } from "@tanstack/react-router";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar({ name }: { name: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-5 py-8 md:flex">
      <Link to="/" className="mb-10 flex items-baseline gap-1 px-2">
        <span className="font-display text-4xl text-gradient-primary">168</span>
        <span className="text-sm font-semibold tracking-widest text-muted-foreground">HRS</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
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
