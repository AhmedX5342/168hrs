# 168hrs

Plan your week around **168 hours** — time, focus, and energy.

Local-first React app. Data lives in `localStorage`.

## Stack

- React 19 + Vite
- react-router-dom
- TanStack Query
- Tailwind CSS 4
- shadcn/ui-style components

## Setup

```bash
npm install   # or bun / pnpm
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm test` | Vitest |

## Routes

| Path | Page |
|------|------|
| `/` | Today (`?date=` optional) |
| `/week` | Week planner |
| `/tasks` | Current week tasks |
| `/tasks/weeks` | Weeks list |
| `/tasks/:weekId` | Tasks for a week |
| `/settings` | Settings / import-export |

## Structure

```
src/
├── main.tsx          # BrowserRouter entry
├── App.tsx           # Routes
├── components/       # Layout + UI
├── features/         # Domain (tasks, today, week, settings…)
├── pages/            # Route screens
├── hooks/
└── lib/
```

Path alias: `@/*` → `src/*`.
