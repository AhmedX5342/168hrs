# 168hrs

<p align="center">
<img src="public/logo.jpeg" alt="168hrs" width="120" />
</p>

<p align="center">
<strong>Plan your week around the only budget that matters: 168 hours.</strong>
</p>

Local-first time & energy planner for people who want to see the whole week clearly — sleep, deep work, life areas, and the spare capacity that’s left.

---

## The problem

Every week has exactly **168 hours**. Most planning tools track tasks or calendars, but they don’t answer the real questions:

- How much of this week is already claimed by sleep and fixed time?
- How much is planned vs free?
- Am I overloaded before the week even starts?
- Where is my time going across life areas (work, fitness, study, …)?

Without that view, people overcommit, underestimate recovery, and only notice the crunch when it’s too late.

**168hrs** makes the week’s capacity visible: you plan blocks against a finite budget, protect sleep, and see warnings when remaining work eats your spare time.

---

## Features

### Planning
- **Today view** — collapsible Incomplete / Unscheduled / Completed; live clock (12/24h); planned vs done (unscheduled counted separately)
- **Week view** — 7-day grid with area colors, start times, and Done / progress on each card; weekly tasks section
- **Task library** — one-off, daily, custom weekdays, weekly, and unscheduled tasks per week
- **Unschedule** — clear a task’s day from the edit form
- **Unexpected tasks** — log work that appears outside the plan (Today & Week)
- **Focus levels** — deep / medium / light
- **Life areas** — tag work; separate colored segments on the week bar

### Focus & progress
- **Focus timer** — fullscreen session, pause/resume, +15 min, keep screen awake, alert when time is up
- **Per-day work log** — long tasks show % and hours on every day you worked them
- **Completion day** — finished tasks appear as Done on the day they were completed (week grid)
- **Carry unfinished** — incomplete work can move into the next week

### Capacity & sleep
- **Per-night sleep target** (not a vague weekly lump)
- **Bedtime / wake schedule** and sleep logs
- **Wasted sleep** — time above your ideal night (default 8h)
- **Spare time** — hours left after planned work
- **Warnings** — low spare (&lt; 3h) and critical overload when work ≥ awake capacity

### Notes
- Optional **Notes** module (toggle in Settings)
- Day-linked notes with optional title, life area, and images
- Pin, edit, delete

### App polish
- **Onboarding** for name & first setup
- **Light / dark** themes (default dark)
- **First day of week** — any day Sun–Sat
- **Show unscheduled tasks** on Today (optional)
- **Import / export** full JSON backups (settings, tasks, notes, sleep, images)
- **Selective clear** — tasks only, notes only, settings only, or everything
- Works as a **web app**; Android APK via **Capacitor** + GitHub Actions

---

## Stack

- React 19 + Vite
- react-router-dom
- TanStack Query
- Dexie (IndexedDB)
- Tailwind CSS 4
- shadcn-style UI primitives
- Capacitor (Android)

---

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build # production build → dist/
npm run preview # preview production build
npm test # Vitest
```

Path alias: `@/*` → `src/*`.

Sample data for screenshots: import `168hrs-sample-data.json` from **Settings → Data**.

---

## Routes

```
| Path             | Page                      |
| ---------------- | ------------------------- |
| `/`              | Today (`?date=` optional) |
| `/week`          | Week planner              |
| `/tasks`         | Current week tasks        |
| `/tasks/weeks`   | Weeks list                |
| `/tasks/:weekId` | Tasks for a week          |
| `/notes`         | Notes list (if enabled)   |
| `/notes/:noteId` | Note editor               |
| `/settings`      | Preferences               |
```

---

## Project structure

```
src/
├── main.tsx # BrowserRouter entry
├── App.tsx # Routes
├── components/ # Layout + UI
├── features/ # Domain (tasks, today, week, notes, settings…)
├── pages/ # Route screens
├── hooks/
└── lib/ # Dexie storage, dates, timer, …
public/
└── logo.jpeg # App logo / favicon source
```

---

## Android (Capacitor)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
# ensure vite.config has base: "./"
npm run build
npx cap add android
npx cap sync android
```

CI: see `.github/workflows/android-build.yml` — builds a debug APK on push and attaches it to a GitHub Release.

---

## Data

All data stays on-device (**Dexie / IndexedDB**). Legacy localStorage backups still import. Export a JSON backup from **Settings → Data** before clearing or switching devices.

---

## License

[MIT](LICENSE) © 2026 Ahmed Ayman Elgharabawy
