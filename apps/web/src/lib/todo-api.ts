import {
  parseTodoSingleResponse,
  parseTodosListResponse,
  safeParseApiErrorEnvelope,
  type TodoDto,
} from "@bmad-todo/shared"

export type { TodoDto }

function apiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL
  if (typeof base !== "string" || base.length === 0) {
    throw new Error("VITE_API_URL is not set")
  }
  return base.replace(/\/$/, "")
}

export class TodoFetchError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "TodoFetchError"
    this.status = status
    this.code = code
  }
}

export async function fetchTodos(): Promise<{ todos: TodoDto[] }> {
  const url = `${apiBaseUrl()}/todos`
  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    if (err instanceof TypeError) {
      throw new TodoFetchError(
        `Cannot reach the API at ${url}. Start it in another terminal with \`pnpm dev:api\` (and ensure \`VITE_API_URL\` in apps/web/.env matches the API port).`,
        0,
      )
    }
    throw new TodoFetchError(
      err instanceof Error ? err.message : String(err),
      0,
    )
  }
  const raw: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const parsed = raw != null ? safeParseApiErrorEnvelope(raw) : null
    throw new TodoFetchError(
      parsed?.error.message ?? res.statusText ?? "Request failed",
      res.status,
      parsed?.error.code,
    )
  }

  if (raw == null) {
    throw new TodoFetchError(
      "Could not read the todo list from the server.",
      res.status,
    )
  }

  try {
    return parseTodosListResponse(raw)
  } catch {
    throw new TodoFetchError(
      "The server returned an unexpected todo list shape.",
      res.status,
    )
  }
}

export async function createTodo(title: string): Promise<TodoDto> {
  const url = `${apiBaseUrl()}/todos`
  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new TodoFetchError(
        `Cannot reach the API at ${url}. Start it in another terminal with \`pnpm dev:api\` (and ensure \`VITE_API_URL\` in apps/web/.env matches the API port).`,
        0,
      )
    }
    throw new TodoFetchError(
      err instanceof Error ? err.message : String(err),
      0,
    )
  }
  const raw: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const parsed = raw != null ? safeParseApiErrorEnvelope(raw) : null
    throw new TodoFetchError(
      parsed?.error.message ?? res.statusText ?? "Request failed",
      res.status,
      parsed?.error.code,
    )
  }

  if (raw == null) {
    throw new TodoFetchError(
      "Could not read the server response after creating a todo.",
      res.status,
    )
  }

  try {
    return parseTodoSingleResponse(raw).todo
  } catch {
    throw new TodoFetchError(
      "The server returned an unexpected todo shape.",
      res.status,
    )
  }
}

export async function updateTodo(
  id: string,
  patch: { completed: boolean },
): Promise<TodoDto> {
  const url = `${apiBaseUrl()}/todos/${encodeURIComponent(id)}`
  let res: Response
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new TodoFetchError(
        `Cannot reach the API at ${url}. Start it in another terminal with \`pnpm dev:api\` (and ensure \`VITE_API_URL\` in apps/web/.env matches the API port).`,
        0,
      )
    }
    throw new TodoFetchError(
      err instanceof Error ? err.message : String(err),
      0,
    )
  }
  const raw: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const parsed = raw != null ? safeParseApiErrorEnvelope(raw) : null
    throw new TodoFetchError(
      parsed?.error.message ?? res.statusText ?? "Request failed",
      res.status,
      parsed?.error.code,
    )
  }

  if (raw == null) {
    throw new TodoFetchError(
      "Could not read the server response after updating a todo.",
      res.status,
    )
  }

  try {
    return parseTodoSingleResponse(raw).todo
  } catch {
    throw new TodoFetchError(
      "The server returned an unexpected todo shape.",
      res.status,
    )
  }
}

export async function deleteTodo(id: string): Promise<void> {
  const url = `${apiBaseUrl()}/todos/${encodeURIComponent(id)}`
  let res: Response
  try {
    res = await fetch(url, { method: "DELETE" })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new TodoFetchError(
        `Cannot reach the API at ${url}. Start it in another terminal with \`pnpm dev:api\` (and ensure \`VITE_API_URL\` in apps/web/.env matches the API port).`,
        0,
      )
    }
    throw new TodoFetchError(
      err instanceof Error ? err.message : String(err),
      0,
    )
  }

  if (res.status === 204) {
    return
  }

  const raw: unknown = await res.json().catch(() => null)
  const parsed = raw != null ? safeParseApiErrorEnvelope(raw) : null
  throw new TodoFetchError(
    parsed?.error.message ?? res.statusText ?? "Request failed",
    res.status,
    parsed?.error.code,
  )
}
