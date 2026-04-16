---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/prd-validation-report.md
---

# bmad-todo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-todo, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create a todo with a short textual description.
FR2: Users can view the full list of todos immediately after app load.
FR3: Users can mark a todo as complete and completed items are visually distinct.
FR4: Users can delete a todo.
FR5: Each todo includes completion status and creation-time metadata.
FR6: Todo data persists across refresh and return visits in the same environment.
FR7: The system exposes an HTTP API supporting CRUD operations aligned to UI capabilities.

### NonFunctional Requirements

NFR1: After successful mutations (create/complete/delete), UI reflects updated state without manual refresh (latency budget to be defined).
NFR2: UI remains usable on representative mobile and desktop viewport sizes.
NFR3: Persistence avoids silent data loss for successful mutations under documented failure assumptions.
NFR4: System is operable and extendable by a small engineering team without hidden dependencies.
NFR5: Recoverable failures surface clear feedback and do not corrupt visible list state.

### Additional Requirements

- Use `npx shadcn@latest init --template vite --name bmad-todo` as initial web starter path.
- Scaffold HTTP API as a separate service (`npm create hono@latest`) and implement REST JSON `/todos` endpoints.
- Use SQLite + Drizzle ORM + drizzle-kit migrations for persistence and schema control.
- Use Zod request/response validation at API boundary; keep response and error contracts consistent.
- Enforce API format conventions: wrapped responses (`{ "todos": [...] }` / `{ "todo": {...} }`) and structured errors (`{ "error": { code, message, details? } }`).
- Use camelCase for JSON fields and snake_case for SQL/Drizzle schema fields.
- Use TanStack Query v5 for server-state with defined query-key conventions and optimistic update rollback behavior.
- Maintain API contract documentation in `docs/api-contract.md`; update it with API changes.
- Implement structured logging and health endpoint (`GET /health`) for operability.
- Deploy as either two services (static web + Node API) or a reverse-proxy topology with explicit `VITE_API_URL` / CORS alignment.
- Configure CI to run lint, typecheck, tests, and builds.
- Keep auth/multi-user/rate-limiting/advanced observability deferred for post-MVP.

### UX Design Requirements

UX-DR1: Implement a single-list, zero-onboarding todo experience where add/complete/delete actions are discoverable without guidance.
UX-DR2: Use a token-first visual system (color/spacing/typography/radius/focus/motion) compatible with Tailwind + Radix/shadcn style primitives.
UX-DR3: Implement status-first visuals so active vs completed todos are distinguishable without relying only on color.
UX-DR4: Provide explicit and non-blocking UI states for empty, loading, and error conditions.
UX-DR5: Keep interaction model consistent across phone and desktop, adapting density without forking behavior.
UX-DR6: Implement inline todo creation with one required text input and button/Enter submission.
UX-DR7: Implement row-level complete and delete actions with clear affordances and touch-safe targets.
UX-DR8: Implement optimistic or near-immediate feedback for mutations with reconciliation to server truth.
UX-DR9: On network/API failure, keep list context visible and show recoverable error UI with Retry.
UX-DR10: Implement accessibility baseline aligned to WCAG 2.1 AA assumptions (focus visibility, contrast checks, non-color-only status cues).
UX-DR11: Ensure keyboard-operable interactions for add, complete, delete, and retry flows.
UX-DR12: Preserve semantic structure for assistive tech (list semantics, labeled controls, accessible delete names).
UX-DR13: Respect prefers-reduced-motion for loading/transitions.
UX-DR14: Implement responsive layout guidance (phone-first; centered readable width on larger screens; maintain >=44px touch targets on small screens).
UX-DR15: Implement a calm visual direction (Direction 1: calm canvas list) with restrained palette and one primary accent.
UX-DR16: Implement component set identified by UX spec: AppShell, AddTodoBar, TodoList, TodoRow, LoadingSkeleton, EmptyState, ErrorBanner (and optional DeleteConfirmDialog).
UX-DR17: Apply consistent feedback hierarchy: primary/secondary/destructive action levels and non-intrusive success handling.
UX-DR18: Keep add-flow validation inline and preserve input where appropriate after recoverable errors.
UX-DR19: Implement completed-item treatment consistently (e.g., strike + muted + checkbox state).
UX-DR20: Validate responsive + accessibility quality through automated checks and manual keyboard/screen-reader spot checks.

### FR Coverage Map

FR1: Epic 1 - Capture and persist a newly created todo.
FR2: Epic 1 - Load and display the full todo list at app open.
FR3: Epic 2 - Toggle completion state with clear completed styling.
FR4: Epic 2 - Delete todo items from list and persistence layer.
FR5: Epic 2 - Return and render completion and creation metadata.
FR6: Epic 1 - Ensure todos persist across refresh and later sessions.
FR7: Epic 2 - Provide full CRUD REST API aligned to UI operations.


## Epic List

### Epic 1: Capture and See My Tasks
Users can open the app, add tasks, and immediately see a persisted list on return visits, establishing the core daily check-in loop.
**FRs covered:** FR1, FR2, FR6

### Epic 2: Manage Task Lifecycle
Users can complete and remove tasks confidently, with clear status and metadata, through fully aligned UI and CRUD API behavior.
**FRs covered:** FR3, FR4, FR5, FR7

### Epic 3: Trust, Clarity, and Cross-Device Quality
Users get a resilient, responsive, accessible experience with understandable loading/empty/error behavior and reliable recovery paths.
**FRs covered:** NFR hardening and UX-DR coverage across FR1-FR7

## Epic 1: Capture and See My Tasks

Users can open the app, add tasks, and immediately see a persisted list on return visits, establishing the core daily check-in loop.

### Story 1.1: Initialize Project from Approved Starter Template

As the engineering team,
I want to bootstrap the project from the approved starter templates,
So that implementation starts from the agreed architecture and conventions.

**Acceptance Criteria:**

**Given** the approved architecture decisions
**When** I initialize the web app from `npx shadcn@latest init --template vite --name bmad-todo`
**Then** the Vite + TypeScript + shadcn baseline is created
**And** dependencies install successfully with documented Node requirements.

**Given** the API baseline requirement
**When** I initialize the API from `npm create hono@latest`
**Then** a runnable Hono service scaffold exists
**And** starter structure aligns with the planned `apps/api` boundary.

**Given** both starters are scaffolded
**When** environment/config placeholders are added
**Then** `VITE_API_URL`, CORS, and DB settings are documented via `.env.example`
**And** the project is ready for feature stories without reworking the base stack.

### Story 1.2: Open App and See Current List State

As an individual user,
I want the app to load my todo list with clear empty/loading/error states,
So that I can immediately understand current status and start managing tasks.

**Acceptance Criteria:**

**Given** I open the app
**When** the initial todo fetch is in progress
**Then** I see a loading state in the list region
**And** the add input remains visible and usable unless explicitly disabled by design.

**Given** the fetch succeeds with no items
**When** data returns
**Then** I see a clear empty state with guidance to add a first todo
**And** no broken/error visuals appear.

**Given** the fetch fails
**When** the response is recoverable
**Then** I see a non-blocking error state with retry affordance
**And** app context remains visible.

### Story 1.3: Create Todo and Persist It

As an individual user,
I want to add a todo from a single input flow,
So that I can quickly capture a task and see it appear in the list.

**Acceptance Criteria:**

**Given** I enter valid text and submit
**When** the create request succeeds
**Then** the new todo appears in the list without manual reload
**And** returned JSON uses agreed camelCase fields.

**Given** I submit empty or invalid input
**When** validation runs
**Then** I receive inline validation feedback
**And** entered text is preserved where appropriate.

**Given** I create a todo
**When** the API responds
**Then** the todo includes id, completed, and createdAt metadata
**And** the API response shape matches the documented contract.

### Story 1.4: Keep Todos Across Refresh and Return

As an individual user,
I want my todos to remain available after refresh or reopening the app,
So that I trust my task list is durable.

**Acceptance Criteria:**

**Given** I have created one or more todos
**When** I refresh or return later
**Then** the same list is loaded from persistence
**And** no successful mutations are silently lost.

**Given** persistence is configured
**When** migrations and database setup run
**Then** the todo schema exists and supports required fields
**And** startup fails visibly if persistence is misconfigured.

## Epic 2: Manage Task Lifecycle

Users can complete and remove tasks confidently, with clear status and metadata, through fully aligned UI and CRUD API behavior.

### Story 2.1: Mark Todo Complete and Incomplete

As an individual user,
I want to toggle a todo's completion state,
So that I can track progress on my task list.

**Acceptance Criteria:**

**Given** a visible todo row
**When** I toggle completion
**Then** the UI reflects pending then final state without full page reload
**And** completed styling is visually distinct and not color-only.

**Given** the toggle request succeeds
**When** API response returns
**Then** stored completion state matches visible state
**And** query cache is reconciled according to the agreed strategy.

**Given** toggle request fails
**When** failure is recoverable
**Then** optimistic state is rolled back
**And** user sees non-blocking error with retry path.

### Story 2.2: Delete Todo Safely

As an individual user,
I want to remove a todo I no longer need,
So that my list stays relevant and uncluttered.

**Acceptance Criteria:**

**Given** an existing todo
**When** I trigger delete
**Then** the item is removed from UI after successful API confirmation (or approved optimistic flow)
**And** persisted data is deleted.

**Given** delete fails
**When** API returns an error
**Then** the row remains or is restored consistently
**And** user receives clear recoverable feedback.

**Given** deletion succeeded
**When** list refetch or cache sync occurs
**Then** deleted id is absent from API and UI
**And** no orphaned row state remains.

### Story 2.3: Show Metadata and Stable Ordering

As an individual user,
I want each todo to show meaningful status and creation information,
So that I can understand recency and completion context.

**Acceptance Criteria:**

**Given** todos are returned by the API
**When** the list renders
**Then** each row shows completion and createdAt metadata
**And** formatting is consistent across rows.

**Given** list ordering rules are defined
**When** data is loaded or mutated
**Then** ordering remains consistent with the contract
**And** behavior does not require future stories to function.

## Epic 3: Trust, Clarity, and Cross-Device Quality

Users get a resilient, responsive, accessible experience with understandable loading, empty, and error behavior and reliable recovery paths.

### Story 3.1: Responsive and Touch-Friendly Layout

As an individual user on phone or desktop,
I want the interface to adapt cleanly to my screen size,
So that core actions remain easy and reliable.

**Acceptance Criteria:**

**Given** phone, tablet, and desktop viewport ranges
**When** layout is rendered
**Then** list and add flow remain usable and legible
**And** interaction model stays consistent across breakpoints.

**Given** mobile and touch usage
**When** interacting with add, complete, and delete controls
**Then** touch targets meet minimum usability guidance
**And** no overlap or truncation blocks core actions.

### Story 3.2: Accessibility and Keyboard Baseline

As a keyboard and assistive-tech user,
I want full access to core todo actions,
So that I can use the product without barriers.

**Acceptance Criteria:**

**Given** keyboard-only navigation
**When** moving through add, list, and actions
**Then** focus order is logical and visible
**And** all primary actions are operable without a mouse.

**Given** semantic list and controls
**When** a screen reader announces elements
**Then** todo rows, checkboxes, and delete actions have clear accessible names
**And** status changes are understandable.

**Given** reduced motion preference
**When** loading or transitions occur
**Then** motion is reduced appropriately
**And** usability is preserved.

### Story 3.3: Error Recovery and Retry Consistency

As an individual user on unstable network,
I want consistent recoverable error behavior,
So that failures do not break my workflow or trust.

**Acceptance Criteria:**

**Given** recoverable API or network failure during fetch or mutation
**When** failure occurs
**Then** the app shows non-blocking error UI with retry
**And** existing list context remains visible.

**Given** a retried action succeeds
**When** response returns
**Then** the UI reconciles with server truth
**And** stale error state clears predictably.

**Given** API errors
**When** they are returned to the client
**Then** the error payload shape follows the documented contract
**And** UI mapping uses stable error codes.

### Story 3.4: Operability Baseline (Config, Health, CI)

As the engineering team,
I want baseline operational safeguards,
So that we can deploy and evolve the MVP safely.

**Acceptance Criteria:**

**Given** repository and environments are configured
**When** developers run standard checks
**Then** lint, typecheck, test, and build are available and documented
**And** CI executes them on changes.

**Given** the API service is running
**When** the health endpoint is called
**Then** it returns expected status for orchestration and debugging
**And** structured logging is emitted for request and error paths.

**Given** client and API deployment topology
**When** environment variables are set
**Then** VITE_API_URL and CORS origins align
**And** the app communicates successfully without hidden dependencies.

