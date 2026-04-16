# API contract — bmad-todo

This document is the source of truth for HTTP JSON behavior and payload shapes.

## Conventions

- **Success bodies** use resource wrappers: `{ "todos": [...] }`, `{ "todo": { ... } }` (camelCase fields).
- **Error bodies** use `{ "error": { "code": string, "message": string, "details"?: unknown } }`.
- **Dates** in JSON are ISO-8601 strings (e.g. `createdAt`).

## Health

### `GET /health`

- **200** — JSON body includes at least:
  - `status`: `"ok"`
  - `service`: `"bmad-todo-api"` (stable identifier for probes)
  - `time`: ISO-8601 timestamp when the response was generated

Example:

```json
{
  "status": "ok",
  "service": "bmad-todo-api",
  "time": "2026-04-16T12:00:00.000Z"
}
```

The API also emits **structured JSON logs** to stdout for each completed request (`event: "http_request"`, `method`, `path`, `status`, `durationMs`) and for route-level failures (`level: "error"`, `event` such as `todos_get_failed`).

## Todos

### `GET /todos`

Returns the current todo list for the environment (MVP: single-user, no auth).

**200 — success**

```json
{
  "todos": []
}
```

Each todo object:

| Field       | Type    | Notes                          |
|------------|---------|--------------------------------|
| `id`       | string  | Stable identifier              |
| `title`    | string  | Short description              |
| `completed`| boolean | Completion flag                |
| `createdAt`| string  | ISO-8601 timestamp             |

**Client validation:** responses must satisfy the shared Zod schema `todosListResponseSchema` from `@bmad-todo/shared`.

**4xx / 5xx — failure**

Body matches the structured error envelope when JSON is returned:

```json
{
  "error": {
    "code": "INTERNAL",
    "message": "Human-readable summary",
    "details": {}
  }
}
```

Exact `code` values will expand as routes grow; clients should treat unknown codes as generic failures and prefer `message` for UI where appropriate.

### `POST /todos`

Creates a todo with the given title (MVP: single-user, no auth).

**Request body (JSON)**

| Field   | Type   | Notes                                      |
|---------|--------|--------------------------------------------|
| `title` | string | Required after trim; max length per shared schema |

**201 — success**

```json
{
  "todo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy milk",
    "completed": false,
    "createdAt": "2026-04-16T12:00:00.000Z"
  }
}
```

**Client validation:** success body must satisfy `todoSingleResponseSchema` from `@bmad-todo/shared`.

**400 — validation**

When the body fails `createTodoBodySchema` (e.g. empty title after trim), response uses the structured error envelope with `code` **`VALIDATION_ERROR`** and optional `details`.

**400 — invalid JSON**

`code`: **`INVALID_JSON`**

### `PATCH /todos/:id`

Partial update (MVP: toggle **`completed`** only).

**Request body (JSON)**

| Field       | Type    | Notes        |
|------------|---------|--------------|
| `completed`| boolean | New value    |

**200 — success**

Same shape as `POST /todos` success: `{ "todo": { ... } }` with camelCase fields. Client validation: `todoSingleResponseSchema`.

**400 — validation**

Body must satisfy `patchTodoBodySchema` from `@bmad-todo/shared`; otherwise **`VALIDATION_ERROR`**.

**400 — invalid JSON**

`code`: **`INVALID_JSON`**

**404 — not found**

`code`: **`NOT_FOUND`** when no row matches **`id`**.

### `DELETE /todos/:id`

Removes the todo permanently (MVP: single-user, no auth).

**204 — success**

Empty body.

**404 — not found**

`code`: **`NOT_FOUND`** when no row matches **`id`**.

### Ordering

`GET /todos` returns todos ordered by **`createdAt` descending** (newest first). Clients should not rely on a different order until the contract changes.
