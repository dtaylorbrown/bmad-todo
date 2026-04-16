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

## Environment

Copy the example env files:

- `apps/web/.env.example`
- `apps/api/.env.example`
