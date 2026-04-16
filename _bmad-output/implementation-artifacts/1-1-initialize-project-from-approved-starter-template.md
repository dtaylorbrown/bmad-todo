# Story 1.1: Initialize Project from Approved Starter Template

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the engineering team,
I want to bootstrap the project from the approved starter templates,
so that implementation starts from the agreed architecture and conventions.

## Acceptance Criteria

1. Given the approved architecture decisions, when I initialize the web app from `npx shadcn@latest init --template vite --name bmad-todo`, then the Vite + TypeScript + shadcn baseline is created, and dependencies install successfully with documented Node requirements.
2. Given the API baseline requirement, when I initialize the API from `npm create hono@latest`, then a runnable Hono service scaffold exists, and starter structure aligns with the planned `apps/api` boundary.
3. Given both starters are scaffolded, when environment/config placeholders are added, then `VITE_API_URL`, `CORS_ORIGINS`, and DB settings are documented via `.env.example`, and the project is ready for feature stories without reworking the base stack.

## Tasks / Subtasks

- [x] Create repo workspace scaffold aligned to architecture tree (AC: 1, 2)
  - [x] Create `apps/web`, `apps/api`, and `packages/shared` directories
  - [x] Add root workspace config (`package.json`, `pnpm-workspace.yaml`) and baseline scripts
- [x] Bootstrap web app with approved starter (AC: 1)
  - [x] Run `npx shadcn@latest init --template vite --name bmad-todo` in `apps/web` context
  - [x] Verify generated config files match expected structure (`components.json`, Vite + TS config files)
- [x] Bootstrap API app with approved starter (AC: 2)
  - [x] Run `npm create hono@latest` for `apps/api` with Node target
  - [x] Add `@hono/node-server` runtime entry and verify local run
- [x] Establish environment and contract scaffolding (AC: 3)
  - [x] Add `.env.example` files for web (`VITE_API_URL`) and api (`DATABASE_URL`, `PORT`, `CORS_ORIGINS`)
  - [x] Add `docs/api-contract.md` placeholder and `GET /health` route stub location reference
- [x] Prepare quality and operational baseline (AC: 3)
  - [x] Add CI workflow skeleton for lint/typecheck/test/build
  - [x] Confirm starter baseline compiles for web and API independently

## Dev Notes

- Follow architecture-first decisions exactly: Vite + shadcn for web, Hono + Node adapter for API, workspace-oriented layout, and shared contract direction.
- Do not implement feature logic (CRUD/data model) in this story beyond bootstrap stubs required to validate startup and structure.
- Preserve naming and folder conventions from architecture (snake_case SQL, camelCase JSON, `/todos` API shape reserved for later stories).
- Ensure starter commands and docs are current at implementation time (`@latest`), but pin package versions once scaffold is committed.

### Project Structure Notes

- Target structure must align with `architecture.md` project tree:
  - `apps/web` (Vite + shadcn baseline)
  - `apps/api` (Hono + node-server baseline)
  - `packages/shared` (schema/types placeholder)
- Keep `docs/api-contract.md` present early to enforce FR-007 contract discipline.
- If starter output differs from target structure, reorganize immediately and document rationale in completion notes.

### References

- Epic source: `_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.1)
- PRD scope and FRs: `_bmad-output/planning-artifacts/prd.md`
- Architecture starter and structure decisions: `_bmad-output/planning-artifacts/architecture.md`
- UX constraints influencing baseline setup: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Sprint tracking state machine: `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- `npx shadcn@latest init --template vite --name bmad-todo --no-monorepo --base radix --preset nova --yes` (required explicit non-interactive flags)
- `npx create-hono@latest . --template nodejs --install --pm pnpm` for API scaffold
- `PORT=3001 pnpm --filter api start` confirmed local runtime entry without port collision

### Implementation Plan

- Scaffold workspace-first baseline and normalize generated structure to `apps/web` and `apps/api`.
- Add contract/environment placeholders before feature work (`.env.example`, `docs/api-contract.md`, `/health` route).
- Add baseline automation and validation (`CI`, lint/typecheck/test/build, API smoke test).

### Completion Notes List

- Story context assembled from epics, PRD, architecture, UX, and current sprint status.
- First story in Epic 1 activates epic status to `in-progress` per sprint-status workflow rules.
- Web starter generated nested output (`apps/web/bmad-todo`); files were moved to `apps/web` to match architecture boundaries.
- Added `GET /health` bootstrap endpoint and API test (`node:test`) while preventing server startup during test import.
- Validated baseline using `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --filter web build`, and `pnpm --filter api build`.
- Documented Node/pnpm requirements and common commands in root `README.md`.
- Added root `.gitignore` to keep workspace build artifacts and local env files out of version control.

### File List

- `_bmad-output/implementation-artifacts/1-1-initialize-project-from-approved-starter-template.md`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `README.md`
- `.gitignore`
- `.github/workflows/ci.yml`
- `apps/web/*` (Vite + shadcn baseline, including `components.json` and TS/Vite config files)
- `apps/web/.env.example`
- `apps/web/eslint.config.js`
- `apps/web/package.json`
- `apps/web/package-lock.json` (removed)
- `apps/api/*` (Hono node starter baseline)
- `apps/api/.env.example`
- `apps/api/package.json`
- `apps/api/src/index.ts`
- `apps/api/src/index.test.ts`
- `packages/shared/README.md`
- `docs/api-contract.md`

### Change Log

- 2026-04-16: Implemented Story 1.1 starter scaffolding, environment/contract placeholders, CI skeleton, and baseline validation to move story to `review`.
- 2026-04-16: Added root `README.md` documenting Node/pnpm requirements and baseline commands.
- 2026-04-16: Added root `.gitignore` for common local artifacts (`node_modules/`, `dist/`, `.env*`).
