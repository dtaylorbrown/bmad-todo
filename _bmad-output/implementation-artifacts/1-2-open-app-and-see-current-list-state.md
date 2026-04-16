# Story 1.2: Open App and See Current List State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an individual user,
I want the app to load my todo list with clear empty, loading, and error states,
so that I can immediately understand current status and start managing tasks.

## Acceptance Criteria

1. **Given** I open the app **when** the initial todo fetch is in progress **then** I see a loading state in the list region **and** the add input remains visible and usable (not disabled by loading unless you document a deliberate product choice in Dev Agent Record).
2. **Given** the fetch succeeds with no items **when** data returns **then** I see a clear empty state with guidance to add a first todo **and** no broken or error visuals appear.
3. **Given** the fetch fails **when** the response is recoverable (network error or API error with retryable semantics) **then** I see a non-blocking error state with a retry affordance **and** app chrome (add bar + surrounding layout) remains visible so context is preserved.

## Tasks / Subtasks

- [x] Establish shared list contract and API list read (AC: 2, 3)
  - [x] Add `packages/shared` workspace package with `package.json`, TypeScript build path, and Zod schemas for a **Todo** DTO (`id`, `title`, `completed`, `createdAt` as ISO strings from API) and **wrapped** list response `{ todos: Todo[] }` per architecture naming (camelCase JSON).
  - [x] Wire `apps/api` and `apps/web` to depend on `shared` via `workspace:*` (or project-standard protocol).
  - [x] Implement `GET /todos` on the Hono app returning **200** with `{ "todos": [] }` on the happy path for this story (no database required yet; Story 1.4 will connect persistence). Validate/normalize the outbound payload with the shared Zod schema so the contract is enforced from day one.
  - [x] Update `docs/api-contract.md` with `GET /todos` success shape, typical **200** response, and structured error envelope `{ "error": { "code", "message", "details?" } }` for failure cases this route may return.
- [x] Add TanStack Query client plumbing and typed fetch helper (AC: 1–3)
  - [x] Add `@tanstack/react-query` (v5) to `apps/web`; create `apps/web/src/lib/query-client.ts` with defaults suited to list fetch (stale time, retry policy for **queries**—align with architecture: retries only where safe; document choices).
  - [x] Create `apps/web/src/lib/todo-api.ts` as the **only** module that performs `fetch` to `${import.meta.env.VITE_API_URL}/todos` (base URL from env); parse JSON and map structured errors for UI.
  - [x] Create `apps/web/src/hooks/useTodosQuery.ts` exposing `useQuery` with a **stable query key** documented in the hook (e.g. `['todos', 'list']`) for later invalidation in Story 1.3+.
- [x] Implement UX shell and list region states (AC: 1–3)
  - [x] Replace the starter placeholder UI with layout matching UX spec component names: `AppShell`, `AddTodoBar`, `TodoList`, `LoadingSkeleton`, `EmptyState`, `ErrorBanner` under `apps/web/src/components/` (composition over raw markup; use existing shadcn primitives from `components/ui/*` where appropriate).
  - [x] **Loading:** show `LoadingSkeleton` (or row placeholders) in the **list region** while the initial query is pending; keep `AddTodoBar` mounted and interactive.
  - [x] **Empty:** when query succeeds with `todos.length === 0`, render `EmptyState` with short copy pointing users to the add field (UX-DR4, calm canvas direction).
  - [x] **Error:** on fetch failure, show non-blocking `ErrorBanner` with **Retry** wired to TanStack Query `refetch`; do not hide the add bar or collapse the shell (UX-DR9, NFR-005).
  - [x] Wrap the tree with `QueryClientProvider` in the web app entry (`main.tsx` or equivalent).
- [x] Tests and verification (AC: 1–3)
  - [x] **API:** Add `src/**/*.test.ts` coverage proving `GET /todos` returns **200** and a body passing the shared list-response schema (import `app` without starting the listener—follow the pattern from Story 1.1 health test).
  - [x] **Web:** Replace the `echo "No tests configured"` stub with **Vitest** + **React Testing Library** (or the stack already preferred in repo if added); test `useTodosQuery` consumer and/or stateful list UI: **loading** renders skeleton, **success empty** renders empty state, **error** renders banner + retry triggers refetch (mock `fetch` or MSW—pick one, stay consistent).
  - [x] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and web build from repo root; fix any regressions.

## Dev Notes

### Architecture compliance (must follow)

- **REST + wrapped JSON:** List endpoint is `GET /todos`; success body `{ "todos": [...] }`; errors `{ "error": { "code", "message", "details?" } }` [Source: `_bmad-output/planning-artifacts/architecture.md` — API Naming / Error patterns].
- **Separation:** Components under `apps/web/src/components/*` are presentational; **server state** lives in hooks using TanStack Query; **do not** call `fetch` from components except inside `todo-api.ts` [Source: architecture — Component Boundaries].
- **Env:** All browser calls use `import.meta.env.VITE_API_URL`; CORS already documented for dev—do not hardcode ports in shared logic [Source: architecture — Integration Points].
- **camelCase JSON / snake_case SQL:** JSON DTOs are camelCase; DB is out of scope for this story’s empty list, but schemas must match the agreed field names for forward compatibility with Story 1.3–1.4 [Source: architecture — Naming Patterns].

### UX compliance (must follow)

- **Component set:** Implement the list experience using the named building blocks: `AppShell`, `AddTodoBar`, `TodoList`, `LoadingSkeleton`, `EmptyState`, `ErrorBanner` [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Component library / states table].
- **States:** Loading uses skeleton in list area; empty is intentional calm copy; errors are recoverable with **Retry**; **prefers-reduced-motion** respected for any motion on skeletons/transitions (UX-DR13).
- **Accessibility baseline for this story:** Semantic regions/live regions as appropriate; retry and add field are keyboard reachable (full WCAG sweep is Story 3.2—do not block on automated a11y suite if not wired yet, but avoid obvious regressions: labels on input/buttons, no color-only status for loading/error).

### Scope boundaries (prevent creep)

- **In scope:** Initial **read** path, list-region UX, contract documentation, shared Zod types, TanStack Query wiring, `GET /todos` happy path returning an empty list.
- **Out of scope:** `POST` create (Story 1.3), SQLite/Drizzle persistence and migrations (Story 1.4), optimistic mutations, complete/delete (Epic 2), full OpenAPI generator.
- **Deliberate empty backend:** Returning a constant empty array from `GET /todos` is acceptable until persistence exists; the **response shape and validation** must match the long-term contract so Story 1.3 only adds write paths and later stories swap in DB-backed reads.

### Library and version notes

- **TanStack Query v5** — use `useQuery` for the list; do not introduce Redux or alternate client state for server data.
- **Zod** — validate outbound list payload on the API and inbound JSON on the client before trusting data.
- **Vitest + RTL** — align web tests with architecture test organization (`*.test.tsx` colocated with components/hooks).

### Project structure notes

- Prefer new files: `apps/web/src/lib/query-client.ts`, `apps/web/src/lib/todo-api.ts`, `apps/web/src/hooks/useTodosQuery.ts`, `apps/web/src/components/todos/*.tsx` (or flat `components/` if simpler—stay consistent with one approach).
- `packages/shared` currently has only `README.md`; this story establishes the real workspace package—mirror TypeScript project references used by `apps/api` and `apps/web`.

### References

- Epic breakdown: `_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.2)
- PRD list and resilience: `_bmad-output/planning-artifacts/prd.md` (FR-002, NFR-005)
- Architecture stack, file mapping, FR table: `_bmad-output/planning-artifacts/architecture.md`
- UX components and state table: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Current API placeholder: `docs/api-contract.md`
- Prior bootstrap story (patterns, commands, testing learnings): `_bmad-output/implementation-artifacts/1-1-initialize-project-from-approved-starter-template.md`
- Sprint tracking: `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Previous story intelligence (Story 1.1)

- API tests should import `app` and use `app.request(...)` without binding a port when possible (see `apps/api/src/index.test.ts` pattern for `/health`).
- Web app was shadcn+Vite scaffold; `App.tsx` is still the starter shell—replace with todo shell per this story.
- Root scripts aggregate `pnpm -r`; any new web test runner must be wired into `apps/web/package.json` `test` script so CI keeps working.
- Node tooling uses **pnpm** workspaces; add dependencies with `pnpm --filter web add` / `pnpm --filter api add` as appropriate.

### Technical research notes (no extra deps without approval)

- Hono `app.request` is suitable for in-process HTTP assertions in Node test runner.
- TanStack Query v5 `QueryClient` defaults should avoid aggressive refetch that fights local dev; document `staleTime` for the todos list query.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

- Vitest initially failed on `??`/`||` precedence in `todo-api.ts` (esbuild parse).
- RTL `getByText` reported duplicate “No todos yet” until `cleanup()` was invoked before each `renderWithProviders` call (stale trees in `document.body`).

### Completion Notes List

- Ultimate context engine analysis completed—comprehensive developer guide created (create-story workflow, 2026-04-16).
- Implemented `@bmad-todo/shared` with Zod DTO + list + error envelope helpers; API `GET /todos` returns schema-validated empty list; added `hono/cors` using `CORS_ORIGINS` for browser dev.
- Web: TanStack Query, `todo-api` as sole fetch boundary, `TodoApp` shell with loading / empty / error+retry states per AC; Vitest + RTL tests for those paths.
- Root scripts now build `shared` before api/web typecheck, test, and build so workspace consumers resolve compiled `dist`.

### File List

- `package.json`
- `pnpm-lock.yaml`
- `docs/api-contract.md`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `apps/api/package.json`
- `apps/api/src/index.ts`
- `apps/api/src/todos.test.ts`
- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `apps/web/tsconfig.app.json`
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/lib/query-client.ts`
- `apps/web/src/lib/todo-api.ts`
- `apps/web/src/hooks/useTodosQuery.ts`
- `apps/web/src/components/todos/AppShell.tsx`
- `apps/web/src/components/todos/AddTodoBar.tsx`
- `apps/web/src/components/todos/TodoList.tsx`
- `apps/web/src/components/todos/TodoApp.tsx`
- `apps/web/src/components/todos/LoadingSkeleton.tsx`
- `apps/web/src/components/todos/EmptyState.tsx`
- `apps/web/src/components/todos/ErrorBanner.tsx`
- `apps/web/src/components/todos/TodoApp.test.tsx`
- `apps/web/src/test/setup.ts`
- `_bmad-output/implementation-artifacts/1-2-open-app-and-see-current-list-state.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-16: Story 1.2 — shared contract, `GET /todos`, list UX with TanStack Query, Vitest/RTL coverage, CORS for dev; sprint status set to `review`.
- 2026-04-16: Code review patch — normalize non-JSON and schema-mismatch success bodies in `fetchTodos` to stable `TodoFetchError` messages; story marked `done`.

### Review Findings

- [x] [Review][Patch] Normalize invalid success bodies before surfacing UI errors — If `res.ok` but the body is not JSON (`raw == null` after `res.json().catch`) or `parseTodosListResponse` throws (schema mismatch), the query error can expose low-level parser/Zod text instead of a concise, user-facing message. Wrap the success-path parse in `try/catch` and rethrow as `TodoFetchError` with a stable summary. [`apps/web/src/lib/todo-api.ts`]
