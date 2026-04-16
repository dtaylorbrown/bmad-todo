import { z } from 'zod'

/** Todo as returned by the HTTP API (camelCase JSON). */
export const todoDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  /** ISO-8601 timestamp string */
  createdAt: z.string(),
})

export type TodoDto = z.infer<typeof todoDtoSchema>

export const todosListResponseSchema = z.object({
  todos: z.array(todoDtoSchema),
})

export type TodosListResponse = z.infer<typeof todosListResponseSchema>

/** Request body for `POST /todos` (camelCase JSON). */
export const createTodoBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(500, "Title is too long"),
})

export type CreateTodoBody = z.infer<typeof createTodoBodySchema>

/** Request body for `PATCH /todos/:id` — partial update (MVP: completion toggle). */
export const patchTodoBodySchema = z.object({
  completed: z.boolean(),
})

export type PatchTodoBody = z.infer<typeof patchTodoBodySchema>

/** Wrapped single-todo response (e.g. `POST /todos` **201**). */
export const todoSingleResponseSchema = z.object({
  todo: todoDtoSchema,
})

export type TodoSingleResponse = z.infer<typeof todoSingleResponseSchema>

/** Structured API error envelope (HTTP 4xx/5xx bodies). */
export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>

export function parseTodosListResponse(data: unknown): TodosListResponse {
  return todosListResponseSchema.parse(data)
}

export function parseTodoSingleResponse(data: unknown): TodoSingleResponse {
  return todoSingleResponseSchema.parse(data)
}

export function safeParseApiErrorEnvelope(
  data: unknown,
): ApiErrorEnvelope | null {
  const r = apiErrorEnvelopeSchema.safeParse(data)
  return r.success ? r.data : null
}
