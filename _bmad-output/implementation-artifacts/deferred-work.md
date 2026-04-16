## Deferred from: code review of 1-1-initialize-project-from-approved-starter-template.md (2026-04-16)

- Global theme toggle hotkey (`d`) in `ThemeProvider` may conflict with future keyboard interactions for todo text fields — deferred as starter baseline behavior.
- Web `test` script is a no-op echo; CI does not run substantive frontend tests yet — deferred until stories introduce UI behavior worth testing.

## Deferred from: code review of 1-4-keep-todos-across-refresh-and-return.md (2026-04-16)

- Eager `export const app = openAppOrExit()` opens SQLite and runs migrations at module import — defer lazy-init / factory refactor for importers and partial tests to a follow-up story (review resolution `D2=2`).

## Deferred from: code review of 1-3-create-todo-and-persist-it.md (2026-04-16)

- Broad dev CORS (`localhost` / `127.0.0.1` auto-allow, missing `[::1]`, wildcard when `Origin` absent) — defer hardening until a security or deploy story.
- `TodoList` may show loading skeleton and error banner at once during retry — defer UX polish.
- `createdAt` in shared Zod is a plain string, not ISO-validated — defer stricter schema until contract tests require it.
