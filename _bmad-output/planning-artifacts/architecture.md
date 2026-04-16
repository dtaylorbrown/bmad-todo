---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/prd-validation-report.md
workflowType: architecture
project_name: bmad-todo
user_name: Daniella
date: '2026-04-15'
lastStep: 8
status: complete
completedAt: '2026-04-15'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The MVP is a **single-user, single-list** todo product. Architecturally, FR-001–FR-004 imply a **write path** (create, update completion, delete) and a **read path** (list) with **row-level** semantics. FR-005 adds **metadata** (completion flag, creation time) that must be stored, returned by the API, and reflected in the UI. FR-006 requires **durable persistence** across sessions for a given deployment/environment—storage choice, backup assumptions, and failure modes belong in architecture. FR-007 requires an **HTTP API** that mirrors UI capabilities; the PRD validation report correctly flags the need for a **documented contract** (resources, payloads, status codes, idempotency where relevant) and **verification hooks** before treating FR-007 as fully measurable.

**Non-Functional Requirements:**

NFR-001 pushes toward **immediate UI feedback** after mutations (optimistic UI or fast round-trips); a **latency budget** is still TBD in the PRD and should be set or deferred with an explicit default for architecture. NFR-002 drives **responsive layout**, touch targets, and breakpoint documentation—UX spec proposes concrete breakpoint bands to refine in implementation. NFR-003 requires architecture and client behavior that **avoid silent loss** on acknowledged success; conflict handling (“server wins” per UX) should be spelled out. NFR-004 calls out **deployment shape** and **low hidden dependency**—containerization, env config, and minimal moving parts are in scope for later architecture steps. NFR-005 implies **structured client–server error handling**, **non-blocking** surfaces, and **retry** without corrupting list truth.

**Scale & Complexity:**

The **feature surface** is intentionally small (CRUD on one entity type). Complexity is **low** relative to enterprise systems, but **full-stack** concerns still apply: **one persistence store**, **one public API**, **one primary client**, and clear **operational** defaults. **Multi-tenancy, auth, and collaboration are out of scope** for MVP, which simplifies data modeling but should still avoid painting the API into a corner for a future **identity** model.

- Primary domain: **full-stack web application** (SPA or MPA-style front end + HTTP JSON API + server persistence, exact stack TBD in starter/decision steps).
- Complexity level: **low** product complexity; **moderate** care on **correctness**, **error handling**, and **a11y** relative to team size.
- Estimated architectural components (logical): **web client**, **HTTP API layer**, **domain/service layer** (thin for MVP), **persistence adapter**, **deployment/runtime** configuration, optional **static asset hosting**—exact boundaries to be decided in structure steps.

### Technical Constraints & Dependencies

- **PRD / validation:** Several **TBD** items (browser support, numeric performance, formal WCAG level in PRD) should either be **decided** in architecture or recorded as **explicit defaults** with rationale.
- **UX:** **Direction 1 (calm canvas list)** and **token-first** UI; **WCAG 2.1 AA** as working UX target until product overrides.
- **No regulated domain** (general productivity) for MVP.
- **No offline-first requirement**; flaky-network **UX** still implies sensible **timeouts**, **retry**, and **honest** UI states.

### Cross-Cutting Concerns Identified

- **Data model and API contract** for todos (ids, timestamps, ordering, delete semantics).
- **Mutation lifecycle**: loading → success/error, optional **optimistic** updates, **reconciliation**, **idempotency** or safe retry for writes.
- **Accessibility and responsive behavior** across the **add bar**, **list**, and **row actions**.
- **Deployment and configuration** (environments, CORS if SPA on separate origin, secrets for any future auth—none for MVP).
- **Traceability** from FR/NFR/UX components to implementation artifacts (aligns with validation recommendations).

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web (React client + HTTP API + persistence)** — aligned with PRD `web_app`, FR-007, and the UX specification’s default implementation pairing (utility/token styling layer + accessible primitives).

### Starter Options Considered

1. **`npx create-next-app@latest`** ([Next.js CLI](https://nextjs.org/docs/app/api-reference/cli/create-next-app)) — **Pros:** one repository, **Route Handlers** for HTTP API, mature deployment story on Vercel-like hosts. **Cons:** couples UI and API lifecycle; slightly more framework surface than needed for a minimal list MVP if you want a maximally small server.

2. **`npm create vite@latest`** with `--template react-ts` ([Vite getting started](https://vite.dev/guide/)) **then** `npx shadcn@latest init` in the project ([shadcn CLI](https://ui.shadcn.com/docs/cli)) — **Pros:** explicit split between SPA build tooling and UI kit setup; very clear boundary for FR-007 as a separate deployable later. **Cons:** two-step setup vs a single composite command.

3. **`npx shadcn@latest init --template vite --name <project>`** ([shadcn CLI](https://ui.shadcn.com/docs/cli)) — **Pros:** one initializer oriented to **Vite + Tailwind + shadcn**-style foundations, matching the UX spec’s default recommendation; Radix-aligned primitives available via `shadcn add`. **Cons:** still **frontend-first**; the **todo HTTP API** and database are **not** created by this command and should be the **next** implementation stories (see note below).

**Maintenance note:** Starters are pinned at **“latest”** by the official CLIs at install time; re-run `npm create …@latest` / `npx …@latest` when starting a new repo so you pick up current templates.

### Selected Starter: shadcn/ui CLI (Vite template)

**Rationale for Selection:**

- **UX alignment:** The UX spec’s default stack is **Tailwind + Radix-class primitives / shadcn**; the **Vite** template path from the official shadcn CLI encodes that direction without inventing a bespoke component layer.
- **MVP scope:** The product is a **single-view** CRUD list; Vite’s fast dev server and static production output fit **NFR-001** (responsive UI updates) without committing to full SSR complexity.
- **API clarity (FR-007):** Keeping the **HTTP API** as a **separate** small service (or a clearly separated package in a monorepo) preserves a **clean contract** for documentation and testing; a good second scaffold is **`npm create hono@latest`** ([Hono guide](https://hono.dev/docs/guides/create-hono)) or another minimal Node HTTP framework—**decide explicitly** in the architectural decisions step if you prefer **Next Route Handlers** instead.

**Initialization Command:**

```bash
npx shadcn@latest init --template vite --name bmad-todo
```

Run from the directory that should contain the new project (or adjust `--name`). Use Node **20.19+** or **22.12+** to satisfy Vite’s current requirement ([Vite getting started](https://vite.dev/guide/)).

**Follow-on command (separate story — HTTP API for FR-007):**

```bash
npm create hono@latest bmad-todo-api
```

*(Substitute another API starter if architectural decisions choose Express/Fastify/etc.)*

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**

TypeScript-oriented React setup (Vite **react-ts** lineage); toolchain assumes a **modern evergreen** dev browser per Vite defaults.

**Styling Solution:**

Tailwind-style utility setup and **CSS variables** for theming, as configured by `shadcn init` (per [shadcn CLI](https://ui.shadcn.com/docs/cli)).

**Build Tooling:**

**Vite** dev server (HMR), production build via Vite’s pipeline ([Vite guide](https://vite.dev/guide/)).

**Testing Framework:**

Not mandated by these starters; add **Vitest + React Testing Library** (and optionally Playwright) in implementation planning.

**Code Organization:**

Vite default `src/` application structure; shadcn adds **`components/ui`** (or equivalent per `components.json`) for generated primitives.

**Development Experience:**

Fast local dev via Vite; `shadcn add <component>` workflow for composing **Button**, **Input**, **Checkbox**, **Dialog**, etc., matching the UX component map.

**Note:** Treat **`npx shadcn@latest init …`** as the **first implementation story** for the client. Treat **API + persistence** scaffolding as **immediately following** stories so FR-007 and FR-006 are satisfied end-to-end.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- **Persistence:** SQLite + Drizzle ORM with SQL migrations (`drizzle-kit`) for FR-006 and durable single-user data.
- **HTTP API:** Hono on Node (`@hono/node-server` per [Hono Node.js guide](https://hono.dev/docs/getting-started/nodejs)) exposing **REST + JSON** for FR-007, colocated validation at the boundary.
- **Client ↔ server integration:** **TanStack Query v5** (`@tanstack/react-query`, current **v5** release line per [TanStack Query](https://tanstack.com/query/latest)) for list fetch and mutations, matching NFR-001/NFR-005 and UX optimistic/retry flows.

**Important Decisions (Shape Architecture):**

- **Request/response validation:** **Zod** schemas shared or mirrored server-side (and client-side for fast feedback) for todo create/update payloads.
- **CORS & transport:** Browser calls API over **HTTPS** in production; **CORS** allows the Vite dev origin and the deployed static origin; credentials **not** required for MVP (no cookies/auth).
- **Error model:** JSON error bodies with **stable `code`** (and optional `message`) for mapping to `ErrorBanner` / row states; use conventional HTTP status codes (4xx client, 5xx server).

**Deferred Decisions (Post-MVP):**

- **Auth / multi-user:** Explicitly out of PRD scope; revisit data model (`user_id`, tenant) before adding accounts.
- **Rate limiting & abuse protection:** Low priority for personal single-user MVP; add edge or middleware limits when exposed publicly.
- **Advanced observability:** APM/tracing deferred; start with **structured stdout logs** and request ids.

### Data Architecture

- **Database:** **SQLite** (file-backed) for MVP—minimal ops, strong fit for single-tenant, low volume ([Drizzle SQLite guide](https://orm.drizzle.team/docs/get-started-sqlite)).
- **ORM & migrations:** **Drizzle ORM** + **drizzle-kit** for schema-as-code and versioned migrations (`drizzle-kit generate` / `migrate`); use **`better-sqlite3`** driver for synchronous, simple Node deployment unless you later prefer `libsql`/Turso for hosted SQLite.
- **Todo model (logical):** `id`, `title` (short text), `completed` (boolean), `createdAt` (ISO timestamp). Ordering default **newest first** (confirm in API contract); **hard delete** on delete (PRD FR-004).
- **Validation:** Zod at HTTP boundary; DB constraints as second line of defense (NOT NULL, CHECK where useful).
- **Caching:** No application cache layer for MVP; optional short `Cache-Control: no-store` on mutable list endpoints to avoid stale intermediaries.

### Authentication & Security

- **Authentication / authorization:** **None** for MVP (PRD out of scope); **do not** expose admin/debug routes on public internet without protection.
- **Transport:** **TLS** everywhere in production; HSTS at edge if supported by host.
- **Headers:** Use Hono-compatible security middleware (CSP, frameguard, etc.) to a **practical baseline** without breaking Vite HMR in dev.
- **Data at rest:** SQLite file on trusted disk; **no** extra field-level encryption required for MVP (non-regulated domain).

### API & Communication Patterns

- **Style:** **REST/JSON** resource **`/todos`** (plural) with `GET`, `POST`, `PATCH`/`PUT` (pick one convention—**PATCH** for partial updates like `completed`), `DELETE` by `id`.
- **Documentation:** **OpenAPI 3** optional but recommended before “freezing” FR-007; minimum is a **markdown contract** in-repo listing paths, schemas, and status codes.
- **Idempotency:** `DELETE` and `PATCH` naturally idempotent by id; `POST` create returns **201** + `Location`; clients use TanStack Query retries only for **safe** replays or dedupe by mutation key where needed.
- **Communication:** Direct **fetch** from browser to API base URL (`VITE_API_URL`); no BFF unless same-origin reverse proxy is chosen for deployment.

### Frontend Architecture

- **State management:** **TanStack Query v5** for **server state**; **local React state** for add-field text and transient UI flags; avoid global client stores for MVP.
- **Components:** **shadcn/ui** primitives per UX (`Button`, `Input`, `Checkbox`, optional `AlertDialog` for delete confirm if product enables it).
- **Routing:** **Single-route SPA** (list home); no client router required beyond default unless you add `/health` client-side later.
- **Performance:** Vite production build + modest bundle; list virtualization **deferred** until large lists are in scope.
- **Accessibility:** Implement **WCAG 2.1 AA** patterns as default per UX (focus rings, names for icon buttons, semantics for list/checkbox).

### Infrastructure & Deployment

- **Shape:** **Two deployables** in MVP—**static** Vite build + **Node** API process—or **one** host serving static files and reverse-proxying `/api` to Hono (team choice during implementation; document in repo README).
- **SQLite in production:** Use a **persistent volume** or equivalent; document **backup** (file copy/Litestream-class tool) as follow-on if data matters beyond casual use.
- **CI/CD:** **GitHub Actions** (or equivalent) running **lint, typecheck, test, build** on PR; optional preview deploys.
- **Configuration:** Environment variables for **database file path**, **API port**, **allowed CORS origins**, and **`VITE_API_URL`** on the client.
- **Monitoring:** Structured JSON logs from Hono; health check route **`GET /health`** for orchestrators.

### Decision Impact Analysis

**Implementation Sequence:**

1. Scaffold **client** (`npx shadcn@latest init --template vite --name bmad-todo`).
2. Scaffold **API** (`npm create hono@latest bmad-todo-api`) and wire **`@hono/node-server`**.
3. Add **Drizzle** schema + initial migration; implement **`/todos`** REST handlers with Zod validation.
4. Add **TanStack Query** to client; implement list + mutations + error/retry UX per UX spec.
5. **Deployment** wiring + **CORS/TLS** verification.

**Cross-Component Dependencies:**

- **CORS origin list** must include the **Vite dev server** origin and production **static** origin.
- **API URL** in client env must match **TLS** and path prefix if using reverse proxy.
- **SQLite file path** must be writable by the API process and **persisted** across restarts on the host.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 8 areas where agents could make incompatible choices without these rules: (1) DB vs JSON naming, (2) REST path shapes, (3) error payload shape, (4) date serialization, (5) TanStack Query keys and invalidation, (6) optimistic rollback semantics, (7) file/folder layout for client vs API, (8) logging field names.

### Naming Patterns

**Database Naming Conventions:**

- **Tables:** plural **snake_case** — e.g. `todos` (not `Todo` / `todo`).
- **Columns:** **snake_case** — e.g. `id`, `title`, `completed`, `created_at` (SQLite/Drizzle physical names).
- **Indexes:** `idx_<table>_<columns>` — e.g. `idx_todos_created_at`.
- **Primary keys:** `id` as **TEXT** UUID (v7 or v4) **or** INTEGER autoincrement—**pick one globally**; default to **TEXT UUID** generated server-side on `POST` for stable client reconciliation.

**API Naming Conventions:**

- **Resources:** plural REST paths — **`/todos`**, **`/todos/:id`** (Hono style `:id` param name **`id`**).
- **Verbs:** `GET /todos` list, `POST /todos` create, `PATCH /todos/:id` partial update (including `completed`), `DELETE /todos/:id` delete.
- **Query params:** **snake_case** if ever needed (e.g. `?include_completed=true`); prefer minimal surface for MVP.
- **Headers:** use standard names only; custom headers **`X-Request-Id`** optional for tracing (Pascal-Case after `X-` per common practice).

**Code Naming Conventions:**

- **React components:** **PascalCase** file and export — `TodoRow.tsx`, `AddTodoBar.tsx`.
- **Hooks:** **`use` + PascalCase domain** — `useTodosQuery.ts`, `useCreateTodoMutation.ts`.
- **Non-component TS modules:** **kebab-case files** where practical — `todo-api.ts`, `todo-schemas.ts`; functions **camelCase** — `fetchTodos`, `mapTodoRow`.
- **Server (Hono) route modules:** **kebab-case** files — `todos-route.ts` or `routes/todos.ts`.
- **Drizzle schema:** single **`schema/todos.ts`** (or `db/schema.ts`) exporting `todos` table definition matching **snake_case** columns.

### Structure Patterns

**Project Organization:**

- **Monorepo (recommended):** `apps/web` (Vite client), `apps/api` (Hono), `packages/shared` (optional Zod schemas + types shared via workspace). If **not** monorepo, keep **identical** `/todos` contract and **shared Zod** duplicated only until a `packages/shared` exists—never drift types silently.
- **Client tests:** **co-located** `*.test.tsx` / `*.test.ts` next to the module under `apps/web/src`.
- **API tests:** **co-located** next to route handlers or under `apps/api/src/__tests__/integration/` for HTTP tests—pick **one** and stick to it; default **integration folder** `apps/api/test/` for supertest-style.
- **Migrations:** `apps/api/drizzle/` (or `db/migrations/`) generated only by **`drizzle-kit`**—hand-edit **only** when fixing a broken migration with team review.

**File Structure Patterns:**

- **Environment:** `apps/web/.env.example` with `VITE_API_URL=`; `apps/api/.env.example` with `DATABASE_URL=`, `PORT=`, `CORS_ORIGINS=` (comma-separated).
- **Docs:** `docs/api-contract.md` for human-readable FR-007 contract until OpenAPI exists.
- **Shared schemas:** `packages/shared/src/todo-schema.ts` (Zod) — **source of truth** for payload shapes; API imports and client may import (workspace) or duplicate with comment `// keep in sync with packages/shared` if workspace deferred.

### Format Patterns

**API Response Formats:**

- **Success:** return **resource JSON directly** — `GET /todos` → `{ "todos": [ ... ] }` **or** bare array `[...]`—**choose wrapped** `{ "todos": [...] }` for forward-compatible pagination; **never mix** array and object across versions without bumping path (`/v2/todos`).
- **Single resource:** `GET`/`PATCH` returns `{ "todo": { ... } }`.
- **Create:** `201` with `{ "todo": { ... } }` and **`Location: /todos/<id>`**.

**Error Response Structure (always this shape on 4xx/5xx):**

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable summary",
    "details": [{ "path": "title", "message": "Required" }]
  }
}
```

- **`code`:** SCREAMING_SNAKE stable identifier for UI mapping (e.g. `NOT_FOUND`, `INTERNAL_ERROR`).
- **`details`:** optional array; omit when empty.

**Data Exchange Formats:**

- **JSON field naming:** **camelCase** in all HTTP bodies and response objects (`createdAt`, not `created_at`).
- **Booleans:** JSON `true`/`false` only.
- **Nulls:** omit optional fields when absent; use `null` only when semantically “explicitly empty” (rare for MVP).
- **Dates:** **ISO-8601 UTC strings** with `Z` suffix in JSON (`"2026-04-15T12:34:56.789Z"`); never epoch-only in API.

### Communication Patterns

**Event System Patterns:**

- **No domain event bus** for MVP. **UI “events”** are standard DOM handlers only.

**State Management Patterns:**

- **TanStack Query**
  - **Query key** for list: `['todos', 'list']` as const tuple.
  - **Detail key** (if added): `['todos', 'detail', id]`.
  - **Mutations:** on success, **`queryClient.invalidateQueries({ queryKey: ['todos'] })`** or precise `setQueryData` update—**pick one strategy per mutation**; default **`setQueryData` for optimistic + invalidate on unknown errors**.
- **Optimistic updates:** follow UX “server wins”; on **4xx/5xx**, **rollback** to previous cache snapshot and surface `error.code`.
- **Retries:** enable **`retry: 1`** for **GET** only; **mutations default `retry: false`** unless idempotent **PATCH/DELETE** with safe server semantics.

### Process Patterns

**Error Handling Patterns:**

- **API:** central Hono **`onError`** hook maps thrown Zod errors → `400` + `VALIDATION_FAILED`; unknown → `500` + generic message, **log stack** server-side.
- **Client:** map `error.error.code` to **banner vs row** per UX; never `alert()`.

**Loading State Patterns:**

- **Initial load:** TanStack Query `isPending` drives **`LoadingSkeleton`** (not spin-blocking full page unless empty first paint requires it).
- **Mutations:** prefer **per-row** `isPending` from mutation variables or disable **Add** button while create mutation pending—**do not** introduce a second global loading flag unless measured necessary.

### Enforcement Guidelines

**All AI Agents MUST:**

- Use **wrapped** list responses `{ "todos": [...] }` and **camelCase** JSON fields matching shared Zod schemas.
- Use **snake_case** only inside **SQL/Drizzle column definitions**, never in public JSON.
- Keep **error JSON** exactly the `{ error: { code, message, details? } }` shape for every non-2xx.
- Use the **fixed TanStack Query key roots** `['todos', ...]` for all todo server state.
- Add **integration tests** for `GET/POST/PATCH/DELETE /todos` before declaring FR-007 satisfied.

**Pattern Enforcement:**

- **PR checks:** run **lint + typecheck + test**; fail on drift from Zod inference types vs handlers.
- **Contract checks:** when OpenAPI exists, verify route handlers against spec in CI; until then, **`docs/api-contract.md` must match code** in the same PR as API changes.
- **Updating patterns:** edit this architecture section plus `docs/api-contract.md` together; never “just change the client.”

### Pattern Examples

**Good Examples:**

- `PATCH /todos/550e8400-e29b-41d4-a716-446655440000` body `{ "completed": true }` → `{ "todo": { "id": "...", "title": "Buy milk", "completed": true, "createdAt": "..." } }`.
- Drizzle row: `{ id, title, completed, created_at }` mapped to response camelCase before `c.json()`.

**Anti-Patterns:**

- Mixing **`/todo`** vs **`/todos`**, or returning **bare array** from `GET /todos` while other endpoints return `{ data: ... }`.
- Using **`created_at` in JSON** for some routes and **`createdAt`** in others.
- **Global fetch** without TanStack Query for todo data (forked cache, inconsistent invalidation).
- **Silent catch** of mutation errors without rollback or user-visible code path.

## Project Structure & Boundaries

### Complete Project Directory Structure

Target: **pnpm/npm workspaces monorepo** named `bmad-todo` (repo root). Adjust package manager files only; **do not** rename logical `apps/*` boundaries.

```
bmad-todo/
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   └── api-contract.md
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.node.json
│   │   ├── index.html
│   │   ├── components.json
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.ts
│   │   ├── .env.example
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── vite-env.d.ts
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   ├── AppShell.tsx
│   │       │   ├── AddTodoBar.tsx
│   │       │   ├── TodoList.tsx
│   │       │   ├── TodoRow.tsx
│   │       │   ├── EmptyState.tsx
│   │       │   ├── ErrorBanner.tsx
│   │       │   └── LoadingSkeleton.tsx
│   │       ├── hooks/
│   │       │   ├── useTodosQuery.ts
│   │       │   └── useTodoMutations.ts
│   │       └── lib/
│   │           ├── query-client.ts
│   │           └── todo-api.ts
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       ├── drizzle.config.ts
│       ├── .env.example
│       ├── src/
│       │   ├── index.ts
│       │   ├── app.ts
│       │   ├── routes/
│       │   │   └── todos.ts
│       │   ├── db/
│       │   │   ├── client.ts
│       │   │   └── schema.ts
│       │   └── middleware/
│       │       └── cors.ts
│       ├── drizzle/
│       │   └── (generated SQL migrations)
│       └── test/
│           ├── setup.ts
│           └── todos.integration.test.ts
└── packages/
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
            └── todo-schema.ts
```

### Architectural Boundaries

**API Boundaries:**

- **Public HTTP surface** lives only in **`apps/api/src/routes/*`** mounted from **`app.ts`** (Hono instance). No database imports in route files except through **`db/`** accessors.
- **Endpoints:** `GET /health`, `GET /todos`, `POST /todos`, `PATCH /todos/:id`, `DELETE /todos/:id` (prefix `/api` **optional**—if used, **document once** in `docs/api-contract.md` and mirror in `VITE_API_URL`; do not mix prefixed and unprefixed across environments).
- **Auth boundary:** none for MVP; **no** “hidden” privileged routes without deployment protection.

**Component Boundaries:**

- **`apps/web/src/components/*`** own presentation + local UI state only.
- **Server state** flows through **`hooks/*`** wrapping TanStack Query; components **do not** call `fetch` directly except inside `lib/todo-api.ts`.
- **`components/ui/*`** are shadcn-generated primitives—**extend** via composition in feature components, avoid forking primitives without design agreement.

**Service Boundaries:**

- **`packages/shared`** holds **Zod** schemas + exported **inferred types** for todo DTOs; **`apps/api`** and **`apps/web`** depend on it via workspace protocol.
- **No circular imports:** `shared` must not import from `web` or `api`.

**Data Boundaries:**

- **SQLite file** accessed only through **`apps/api/src/db/client.ts`** and Drizzle queries; migrations live under **`apps/api/drizzle/`** and are applied only by API tooling/CI.
- **Caching boundary:** none in MVP beyond TanStack Query client cache.

### Requirements to Structure Mapping

**FR / NFR mapping:**

| Requirement | Primary location |
|-------------|------------------|
| FR-001 Create | `AddTodoBar.tsx`, `useTodoMutations.ts`, `POST` in `routes/todos.ts` |
| FR-002 View list | `TodoList.tsx`, `useTodosQuery.ts`, `GET` in `routes/todos.ts` |
| FR-003 Complete | `TodoRow.tsx`, `PATCH` in `routes/todos.ts` |
| FR-004 Delete | `TodoRow.tsx`, `DELETE` in `routes/todos.ts` |
| FR-005 Metadata | `TodoRow.tsx`, `schema.ts`, serializers in `routes/todos.ts` |
| FR-006 Persistence | `db/schema.ts`, `db/client.ts`, `drizzle/*` |
| FR-007 HTTP API | `routes/todos.ts`, `docs/api-contract.md` |
| NFR-001 / NFR-005 UX responsiveness & errors | `hooks/*`, `ErrorBanner.tsx`, `todo-api.ts` |

**Cross-cutting:**

| Concern | Location |
|---------|----------|
| Shared validation | `packages/shared/src/todo-schema.ts` |
| CORS | `apps/api/src/middleware/cors.ts` |
| Query client defaults | `apps/web/src/lib/query-client.ts` |
| CI | `.github/workflows/ci.yml` |

### Integration Points

**Internal communication:**

- **Browser → API:** `fetch`/`Request` to **`import.meta.env.VITE_API_URL`** base; all paths relative to that base.
- **API → DB:** Drizzle from `db/client.ts` inside route handlers or thin “repository” functions colocated in `routes/todos.ts` until growth warrants `services/`.

**External integrations:**

- None for MVP (no analytics/auth/payment SDKs in default structure).

**Data flow:**

1. UI invokes TanStack Query mutation/query → **`todo-api.ts`**.
2. HTTP JSON crosses to **`routes/todos.ts`** → Zod validate (`shared`) → Drizzle read/write **`todos`** table.
3. Response JSON (camelCase) returns; Query cache updates; UI re-renders.

### File Organization Patterns

**Configuration files:**

- **Root:** workspace definition (`pnpm-workspace.yaml`), root scripts for `lint/test/build` orchestration.
- **Per app:** `vite.config.ts` (web), `drizzle.config.ts` + `tsconfig.json` (api), `components.json` (web).

**Source organization:**

- **Feature-first inside `apps/web/src/components`** for todo-specific UI; **`ui/`** reserved for shadcn primitives.

**Test organization:**

- **Web:** `*.test.tsx` next to components/hooks.
- **API:** `apps/api/test/*.integration.test.ts` for HTTP black-box tests against running app or test server helper.

**Asset organization:**

- **Static:** `apps/web/public/` for favicon only unless product adds assets; list UI is component-driven.

### Development Workflow Integration

**Development servers:**

- **`apps/web`:** `pnpm --filter web dev` (Vite, typically port **5173**).
- **`apps/api`:** `pnpm --filter api dev` (Node + Hono, chosen **PORT** e.g. **3001**).
- **CORS:** `CORS_ORIGINS` must list the Vite origin used day-to-day.

**Build:**

- **Web:** `vite build` → static assets under `apps/web/dist/`.
- **Api:** `tsc` (or `tsup` if adopted later) → `apps/api/dist/`; run migrations in deploy step **before** process start.

**Deployment:**

- **Two processes** or **one reverse proxy** serving `dist/` and proxying `/` vs `/api`—either way, **document** the public URL split in root `README.md` so `VITE_API_URL` matches production.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**

The stack is internally consistent: **TypeScript** end-to-end, **JSON over HTTP** between Vite and Hono, **Drizzle** as the only DB access path from the API, and **TanStack Query** as the only todo server-state cache in the client. **Node 20.19+ / 22.12+** satisfies Vite; Hono’s Node adapter is documented for the same class of deployment.

**Pattern Consistency:**

Naming rules (**snake_case** in SQLite, **camelCase** in JSON) match the chosen REST + TypeScript shapes. Error JSON is stable enough for UX `ErrorBanner` mapping. **Action:** align TanStack Query keys so **`['todos']` prefix invalidation** always covers `['todos', 'list']` (or collapse to a single canonical list key—document the chosen tuple in `query-client.ts`).

**Structure Alignment:**

The monorepo tree places **HTTP routes**, **DB**, **UI**, and **shared schemas** where agents expect them; integration points (`VITE_API_URL`, `CORS_ORIGINS`, `docs/api-contract.md`) are explicit.

### Requirements Coverage Validation

**Epic/Feature Coverage:**

No epics were loaded; coverage is traced from **FR/NFR** tables in the PRD and the UX specification.

**Functional Requirements Coverage:**

| FR | Supported by |
|----|----------------|
| FR-001–FR-005 | Web components + hooks + `routes/todos.ts` + `schema.ts` |
| FR-006 | SQLite + Drizzle migrations + persistent volume (ops) |
| FR-007 | Hono `/todos` + `docs/api-contract.md` / future OpenAPI |

**Non-Functional Requirements Coverage:**

| NFR | Architectural answer |
|-----|------------------------|
| NFR-001 | TanStack Query mutations + optional optimistic updates; Vite fast refresh |
| NFR-002 | Responsive layout in web app; breakpoints per UX |
| NFR-003 | Server-authoritative responses; no silent success on 5xx |
| NFR-004 | Small stack, documented deploy; CI in `.github/workflows` |
| NFR-005 | Standard error JSON + retry policy for GET; mutation error mapping |

**PRD TBDs** (browser matrix, numeric latency, formal WCAG in PRD) remain product decisions—architecture assumes **WCAG 2.1 AA** as working target per UX and **evergreen** dev browsers per Vite.

### Implementation Readiness Validation

**Decision Completeness:**

Critical paths (persistence, API style, client data layer, deployment shape options) are documented. **Versioning:** use **`@latest` scaffolds** at init time; pin versions in `package.json` when implementation starts.

**Structure Completeness:**

Directory tree is concrete enough for agents to create files without inventing parallel folders.

**Pattern Completeness:**

Conflict-prone areas (JSON shape, errors, dates, query keys, test locations) have rules and examples.

### Gap Analysis Results

**Critical gaps:** none identified for MVP implementation start.

**Important gaps:**

1. **Canonical TanStack Query key** for the list should be fixed in code comments + patterns (see coherence note).
2. **`/api` prefix** decision is explicitly optional—must be resolved per environment in `README.md` + `VITE_API_URL` before production.
3. **OpenAPI** still optional; FR-007 “documented HTTP API” minimum is **`docs/api-contract.md`** until OpenAPI lands.

**Nice-to-have:** Litestream/backup for SQLite; Playwright E2E; bundle analyzer on web.

### Validation Issues Addressed

No blocking contradictions found. **Query key** inconsistency is a **documentation-level** fix applied here in validation notes; implementation should pick one convention in `query-client.ts`.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed (defaults + hooks for NFR-001)

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High for MVP scope; medium until PRD TBDs (browsers, p95, WCAG sign-off in PRD) are closed for compliance-sensitive stakeholders.

**Key Strengths:**

- Clear **client/API/data** split aligned with FR-007 and team scaling.
- **Shared Zod** reduces contract drift.
- **Patterns + tree** give agents unambiguous file targets.

**Areas for Future Enhancement:**

- Auth, multi-tenant data model, rate limiting, observability beyond logs, hosted DB migration off file SQLite.

### Implementation Handoff

**AI Agent Guidelines:**

- Follow architectural decisions, patterns, and structure in this document as the **single technical source of truth**.
- Change **API contracts** only together with **`docs/api-contract.md`** and client consumers.

**First Implementation Priority:**

1. `npx shadcn@latest init --template vite --name bmad-todo` (then lift into `apps/web` if using monorepo template manually).
2. `npm create hono@latest` for `apps/api`, add Drizzle + SQLite, implement `/todos`.
3. Wire `packages/shared` Zod and TanStack Query on the client.
