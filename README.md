# bmad-todo

Monorepo baseline for the `bmad-todo` project.

## Requirements

- Node.js **20+** (CI uses Node 20; local dev should match)
- pnpm **10+** (see `packageManager` in `package.json`)

## Install

```bash
pnpm install
```

## Common commands

```bash
pnpm dev:web
pnpm dev:api

pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs **`pnpm lint`**, **`pnpm typecheck`**, **`pnpm test`**, and **`pnpm build`** on pushes and pull requests to **`main`**, using Node **20** and pnpm **10** with a frozen lockfile install.

## Local development (web + API)

The browser loads todos from the API URL in `VITE_API_URL` (`apps/web/.env`). You need **both** processes running:

1. **Terminal A — API:** `pnpm dev:api` (listens on `PORT` from `apps/api/.env`, default **3001** so it does not fight other tools on **3000**).
2. **Terminal B — web:** `pnpm dev:web` (Vite, usually **http://localhost:5173**).

If you only run `pnpm dev:web`, the list request fails with a network error because nothing is listening on the API port.

Copy env examples first (`apps/web/.env.example` → `apps/web/.env`, `apps/api/.env.example` → `apps/api/.env`). Keep `VITE_API_URL` aligned with `PORT` (e.g. both **3001**). The API allows any `http://localhost:*` / `http://127.0.0.1:*` origin when `NODE_ENV` is not `production`, so alternate Vite ports still work.

Todos are stored in **SQLite** under the path from `SQLITE_PATH`, or by default `data/todos.db` **relative to the API process working directory** (with `pnpm dev:api`, that is usually `apps/api`, so the file is typically `apps/api/data/todos.db` on disk). The `data` folder is gitignored. Drizzle migrations in `apps/api/drizzle/` run when the API process starts.

Refreshing or reopening the web app always runs a new list fetch against the API, so you see whatever is stored in that SQLite file. Restarting the API keeps the same data as long as `SQLITE_PATH` is unchanged (or you keep the default path).

### Port already in use (`EADDRINUSE`)

If `pnpm dev:api` fails because **3001** (or your `PORT`) is taken, pick a free port in `apps/api/.env` and set the same base URL in `apps/web/.env` as `VITE_API_URL`. To see what holds a port (example for 3000): `lsof -nP -iTCP:3000 -sTCP:LISTEN`.

## Environment

Copy the example env files:

- `apps/web/.env.example`
- `apps/api/.env.example`
