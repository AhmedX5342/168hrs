# Drop TanStack Start / Router → Vite + react-router-dom

## Root cause of your errors

1. **`Could not resolve entry for router entry: router`**  
   `vite.config.ts` still used `@lovable.dev/vite-tanstack-config`, which loads TanStack Start and looks for `src/router.tsx`.

2. **`useLocation() may be used only in the context of a <Router>`**  
   TanStack Start was still mounting the tree (or a leftover shell) **without** `BrowserRouter`, so `NavLink` in `Sidebar` / `BottomNav` crashed.

## Files to replace / add in your project root

| File | Action |
|------|--------|
| `vite.config.ts` | **Replace** with plain Vite config (no Lovable/TanStack Start) |
| `package.json` | **Replace** — removes `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@lovable.dev/vite-tanstack-config`, `nitro`, `vite-tsconfig-paths` |
| `index.html` | **Add** at project root — entry is `/src/main.tsx` |
| `tsconfig.json` | Update `baseUrl` + `@/*` paths |
| `bunfig.toml` | Optional cleanup |

## Delete these if they still exist

```
src/router.tsx
src/routeTree.gen.ts
src/start.ts
src/server.ts
src/routes/          (entire folder)
```

## Ensure entry chain

```
index.html  →  src/main.tsx  →  <BrowserRouter> → <App /> → AppLayout (NavLinks) + <Routes>
```

`BrowserRouter` **must** wrap anything that uses `NavLink` / `useNavigate` / `useLocation`.

## Reinstall

```bash
# remove lock + modules so old TanStack Start deps are gone
rm -rf node_modules bun.lock bun.lockb package-lock.json
bun install   # or: npm install / pnpm install
bun run dev   # or: npm run dev
```

## Vite note

`resolve.tsconfigPaths: true` is used instead of the `vite-tsconfig-paths` plugin. `@` is also set via `resolve.alias` as a fallback.
