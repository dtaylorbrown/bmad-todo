# Story 1.4: Keep Todos Across Refresh and Return

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an individual user,
I want my todos to remain available after refresh or reopening the app,
so that I trust my task list is durable.

## Acceptance Criteria

1. **Given** I have created one or more todos **when** I refresh the browser or open the app again later (same machine, same API deployment, same `SQLITE_PATH` / default DB file) **then** the list loaded from the server matches what was persisted **and** no completed successful create is missing from the list after the next successful load.
2. **Given** persistence is configured **when** the API process starts **then** migrations run so the `todos` schema exists for reads and writes **and** if persistence or migrations cannot be applied, startup fails in a **visible** way (clear stderr message and non-zero exit), not a silent hang or a server that accepts traffic without a working store.

## Tasks / Subtasks

- [x] API durability proof (AC: 1, 2)
  - [x] Add an automated test that uses a **real temporary SQLite file** (e.g. `fs.mkdtempSync` + `join` path): open DB + `createApp`, `POST /todos`, close SQLite; open a **new** `Database` on the **same file path**, `createApp`, `GET /todos` — assert the created todo is present (proves persistence across process-level “return” consistent with FR-006).
  - [x] If startup migration or DB open fails, ensure `apps/api/src/index.ts` (or `create-app.ts`, single place) logs a **short, human-readable** error to stderr and exits with **code 1** before `serve` listens (wrap `createApp` / `migrate` / constructor in `index.ts` try/catch); avoid duplicate noisy stacks where possible.
- [x] Web refresh / remount behavior (AC: 1)
  - [x] Confirm list query runs on **fresh mount** after simulated “return”: e.g. RTL test with two mounts / two `QueryClientProvider` instances (or explicit `queryClient.clear()` + remount) where mocked `fetch` for `GET /todos` returns persisted items after a successful create path — user-visible list matches server after “reload”.
  - [x] Document in Dev Agent Record if any `defaultOptions.queries` change was required (e.g. `refetchOnMount: 'always'` vs defaults) and why; prefer minimal change — full page refresh already creates a new `QueryClient` in `main.tsx`.
- [x] Docs and verification (AC: 1, 2)
  - [x] Update `README.md` (or `docs/api-contract.md` “Operations” note) with one short paragraph: todos live in the SQLite file; **refresh/reopen** the web app re-fetches from the API; **API restart** keeps data when `SQLITE_PATH` (or default `data/todos.db`) is unchanged.
  - [x] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` from repo root.

## Dev Notes

### Architecture compliance

- **Persistence:** SQLite file is the source of truth; API is the only writer; browser has no durable local todo store for MVP [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Architecture, FR-006 mapping].
- **TanStack Query:** List key remains `['todos', 'list']` (`todosListQueryKey`); mutations already invalidate on create — do not introduce a parallel cache for todos [Source: architecture — State Management / query keys].
- **Fetch boundary:** Browser HTTP only via `apps/web/src/lib/todo-api.ts` [Source: architecture — Component Boundaries].

### Previous story intelligence (1.3)

- `createApp(sqlite)` runs `migrate()` synchronously at construction; tests use `:memory:` per suite.
- `index.ts` uses `SQLITE_PATH` ?? `data/todos.db`, `mkdirSync(dirname(dbPath))`, `listenPort()` validation.
- `GET`/`POST` `/todos` return structured `INTERNAL` JSON on unexpected DB errors (try/catch in `create-app.ts`).

### UX / product

- “Silent loss” in AC means: after the UI shows a **successful** create (mutation settled, list updated), a subsequent **successful** full load must not drop that item. Cover with test; do not change product semantics unless a bug is found.

### References

- `_bmad-output/planning-artifacts/epics.md` (Story 1.4)
- `_bmad-output/planning-artifacts/architecture.md` (Persistence, TanStack Query, error patterns)
- `_bmad-output/implementation-artifacts/1-3-create-todo-and-persist-it.md`
- `docs/api-contract.md`
- `README.md`

## Dev Agent Record

### Agent Model Used

(implementation session)

### Debug Log References

### Completion Notes List

- File-backed persistence test closes SQLite and reopens the same path to mimic a new API process against the same DB file.
- Startup failures use `console.error` + `process.exit(1)` in `openAppOrExit()` so `serve` never binds when the DB cannot open or migrate.
- Web remount test uses in-memory “server” todo array; no change to `query-client.ts` defaults — a real browser refresh gets a new `QueryClient` from `main.tsx`, so `staleTime` does not block the first fetch on a new session.

### Change Log

- 2026-04-16: Story context created from `epics.md` Story 1.4, architecture persistence/query patterns, and Story 1.3 learnings; status `ready-for-dev`.
- 2026-04-16: Implemented ACs — persistence integration test, startup guard in `index.ts`, RTL remount test, README note; `pnpm lint/typecheck/test/build` green; status `review`.
- 2026-04-16: Code review — `PORT` startup errors exit 1 with stderr; README `cwd` note for default DB path; persistence test cleanup hardened; sprint decision dismissed; lazy app init deferred; status `done`.

### File List

- `apps/api/src/index.ts`
- `apps/api/src/persistence-durability.test.ts`
- `apps/web/src/components/todos/TodoApp.test.tsx`
- `README.md`
- `_bmad-output/implementation-artifacts/1-4-keep-todos-across-refresh-and-return.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

- [x] [Review][Dismiss] Sprint status rows outside Story 1.4 — Resolved 2026-04-16: intentional global tracker sync (`D1=1`); no YAML change required from this review.

- [x] [Review][Defer] Eager DB open at module import — Deferred 2026-04-16: lazy-init / factory `app` in a follow-up story (`D2=2`); keep current eager `openAppOrExit()` for now.

- [x] [Review][Patch] Invalid `PORT` should fail like DB errors — Fixed 2026-04-16: `listenPort()` errors in the direct-execution branch are caught; `console.error` + `process.exit(1)` before `serve` binds. [`apps/api/src/index.ts`]

- [x] [Review][Patch] README default DB path vs `cwd` — Fixed 2026-04-16: README clarifies default `data/todos.db` is relative to API `cwd` (typically `apps/api` under `pnpm dev:api`). [`README.md`]

- [x] [Review][Patch] Persistence durability test cleanup — Fixed 2026-04-16: `finally` defensively closes any open DB handles and wraps `rmSync` in try/catch. [`apps/api/src/persistence-durability.test.ts`]
