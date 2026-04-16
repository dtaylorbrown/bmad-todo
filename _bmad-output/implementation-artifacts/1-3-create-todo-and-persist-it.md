# Story 1.3: Create Todo and Persist It

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an individual user,
I want to add a todo from a single input flow,
so that I can quickly capture a task and see it appear in the list.

## Acceptance Criteria

1. **Given** I enter valid text and submit **when** the create request succeeds **then** the new todo appears in the list without manual reload **and** returned JSON uses agreed camelCase fields.
2. **Given** I submit empty or invalid input **when** validation runs **then** I receive inline validation feedback **and** entered text is preserved where appropriate.
3. **Given** I create a todo **when** the API responds **then** the todo includes id, completed, and createdAt metadata **and** the API response shape matches the documented contract.

## Tasks / Subtasks

- [x] Shared contract for create (AC: 1, 3)
  - [x] Add `createTodoBodySchema` and `todoSingleResponseSchema` / `parseTodoSingleResponse` in `packages/shared`; export types for API and web.
- [x] Persistence and `POST /todos` on API (AC: 1, 3)
  - [x] Add Drizzle + `better-sqlite3`; `apps/api/src/db/schema.ts` with `todos` table (`id`, `title`, `completed`, `created_at` snake_case in DB).
  - [x] Initial migration under `apps/api/drizzle/`; run migrations on app startup via `drizzle-orm/better-sqlite3/migrator` (path resolved from `import.meta.url`).
  - [x] Refactor to `createApp(sqlite)` for tests; `index.ts` opens default file DB at `data/todos.db` (override with `SQLITE_PATH`), ensures `data/` exists.
  - [x] `GET /todos` reads from SQLite ordered **newest first** (`created_at` DESC).
  - [x] `POST /todos`: validate body with shared schema; **201** + `{ todo }` validated with Zod; **400** `VALIDATION_ERROR` or `INVALID_JSON` with error envelope.
- [x] Web create flow (AC: 1–3)
  - [x] Extend `todo-api.ts` with `createTodo` only (no new fetch sites in components).
  - [x] `useCreateTodoMutation` invalidates `todosListQueryKey` on success.
  - [x] `AddTodoBar`: controlled input, `<form>` submit, client validation via `createTodoBodySchema`, preserve title on server failure, clear on success, surface server errors; disable input/button while submitting.
  - [x] Wire `TodoApp` to mutation props.
- [x] Docs, env, and tests (AC: 1–3)
  - [x] Update `docs/api-contract.md` for `POST /todos`.
  - [x] Update `apps/api/.env.example` for SQLite; gitignore `apps/api/data/`.
  - [x] README note on SQLite location and migrations.
  - [x] API tests: memory DB per suite via `createApp`; POST+GET integration; validation 400.
  - [x] Web RTL tests: whitespace-only inline validation (no POST); successful create shows row after refetch mock.
  - [x] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Dev Notes

### Architecture compliance

- REST + wrapped JSON: `POST /todos` → **201** `{ "todo": { ... } }`; errors `{ "error": { "code", "message", "details?" } }`.
- SQLite + Drizzle only in `apps/api`; shared Zod at HTTP boundary; TEXT UUID + ISO `createdAt` on create.
- Browser fetch only in `todo-api.ts`; list mutations via TanStack Query hooks.

### UX compliance

- Inline validation for empty/whitespace title; server failures show message without clearing typed title until success.

### References

- `_bmad-output/planning-artifacts/epics.md` (Story 1.3)
- `_bmad-output/planning-artifacts/architecture.md` (Data, API patterns)
- `_bmad-output/implementation-artifacts/1-2-open-app-and-see-current-list-state.md`
- `docs/api-contract.md`

## Dev Agent Record

### Agent Model Used

(implementation session)

### Debug Log References

- API `Database` default export typing: use `InstanceType<typeof Database>` for `createApp` parameter.
- Web `onAdd` needed `async` wrapper so `mutateAsync` resolves to `Promise<void>` for `AddTodoBar` props.

### Completion Notes List

- Implemented SQLite persistence with Drizzle migrations; `GET`/`POST` `/todos` with Zod-validated payloads.
- Web: create mutation + form validation + tests; root `pnpm build` verified.

### File List

- `README.md`
- `docs/api-contract.md`
- `pnpm-lock.yaml`
- `packages/shared/src/index.ts`
- `apps/api/package.json`
- `apps/api/drizzle.config.ts`
- `apps/api/drizzle/0000_init_todos.sql`
- `apps/api/drizzle/meta/_journal.json`
- `apps/api/drizzle/meta/0000_snapshot.json`
- `apps/api/.env.example`
- `apps/api/.gitignore`
- `apps/api/src/db/schema.ts`
- `apps/api/src/create-app.ts`
- `apps/api/src/index.ts`
- `apps/api/src/index.test.ts`
- `apps/api/src/todos.test.ts`
- `apps/web/src/lib/todo-api.ts`
- `apps/web/src/hooks/useCreateTodoMutation.ts`
- `apps/web/src/components/todos/AddTodoBar.tsx`
- `apps/web/src/components/todos/TodoApp.tsx`
- `apps/web/src/components/todos/TodoApp.test.tsx`
- `_bmad-output/implementation-artifacts/1-3-create-todo-and-persist-it.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-16: Story 1.3 — SQLite + Drizzle, `POST /todos`, list reads DB, web create + invalidate; sprint status `review`.
- 2026-04-16: Code review (Step 2–4) — parallel Blind Hunter, Edge Case Hunter, Acceptance Auditor; triage recorded under Review Findings.
- 2026-04-16: Code review patches applied (SQLite parent dir, PORT validation, INTERNAL envelopes on todo routes, `TodoFetchError` normalization); story marked `done`.

### Review Findings

- [x] [Review][Patch] Create the parent directory of the configured SQLite file before opening the database — today `mkdirSync` always targets `./data` even when `SQLITE_PATH` points elsewhere, so a custom path whose parent does not exist can throw at startup. [apps/api/src/index.ts:8-11] — fixed 2026-04-16 (`dirname(dbPath)` + `mkdirSync`)
- [x] [Review][Patch] Validate `PORT` after `Number(...)` so whitespace, `NaN`, or out-of-range values do not produce confusing bind errors. [apps/api/src/index.ts:22] — fixed 2026-04-16 (`listenPort()`)
- [x] [Review][Patch] Wrap `GET /todos` and `POST /todos` database and DTO parsing in `try/catch` and return the structured `{ error: { code: "INTERNAL", ... } }` envelope on unexpected failures instead of an unstructured 500. [apps/api/src/create-app.ts:68-129] — fixed 2026-04-16
- [x] [Review][Patch] In `todo-api.ts`, normalize non-`TypeError` rejections from `fetch` into `TodoFetchError` so callers always see the typed error path. [apps/web/src/lib/todo-api.ts:33-89] — fixed 2026-04-16
- [x] [Review][Defer] Broad dev CORS (`localhost` / `127.0.0.1` auto-allow, `Origin` absent returning `*`, no `[::1]`) — acceptable for MVP local dev; tighten or document when hardening. [apps/api/src/create-app.ts:34-60] — deferred, pre-existing
- [x] [Review][Defer] `TodoList` can show loading skeleton and error banner together during refetch-after-error — minor UX polish. [apps/web/src/components/todos/TodoList.tsx] — deferred, pre-existing
- [x] [Review][Defer] Shared `todoDtoSchema` uses plain `z.string()` for `createdAt` while docs stress ISO-8601 — consider `z.string().datetime()` or refine when contract tests tighten. [packages/shared/src/index.ts] — deferred, pre-existing

