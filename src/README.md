# src/ — react-router-dom layout

Organized after removing TanStack Router / Start.

```
src
├── App.tsx                 # <Routes> / <Route>
├── main.tsx                # BrowserRouter + QueryClient + ReactDOM
├── styles.css
├── components
│   ├── PageHeader.tsx
│   ├── layout
│   │   ├── AppLayout.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Sidebar.tsx
│   │   └── nav-items.ts
│   └── ui/                 # shadcn-style primitives
├── features
│   ├── life-areas/
│   ├── onboarding/
│   ├── settings/
│   ├── tasks/
│   ├── today/
│   ├── week/
│   └── weeks/
├── hooks/
├── lib/
├── pages/                  # route elements (not file-based routes)
│   ├── TodayPage.tsx       # /
│   ├── WeekPage.tsx        # /week
│   ├── TasksPage.tsx       # /tasks
│   ├── WeekTasksPage.tsx   # /tasks/:weekId
│   ├── WeeksPage.tsx       # /tasks/weeks
│   ├── SettingsPage.tsx    # /settings
│   └── NotFoundPage.tsx
└── test/
```

**Removed vs old tree:** `routes/`, `routeTree.gen.ts`, `router.tsx`, `start.ts`, `server.ts`, `__root.tsx`.

**Requires:** `react-router-dom`, `@/` → `src/` in tsconfig/vite.
