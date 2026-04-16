import Database from "better-sqlite3"
import { desc, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { fileURLToPath } from "node:url"
import {
  createTodoBodySchema,
  parseTodoSingleResponse,
  patchTodoBodySchema,
  todoDtoSchema,
  todosListResponseSchema,
} from "@bmad-todo/shared"

import * as schema from "./db/schema.js"

const { todos } = schema

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url))

function logRouteError(event: string, err: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      message: err instanceof Error ? err.message : String(err),
    }),
  )
}

export function createApp(sqlite: InstanceType<typeof Database>): Hono {
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder })

  const app = new Hono()

  app.onError((err, c) => {
    logRouteError(`unhandled_exception:${c.req.path}`, err)
    return c.json(
      {
        error: {
          code: "INTERNAL",
          message: "Something went wrong.",
        },
      },
      500,
    )
  })

  const corsOrigins =
    process.env.CORS_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? ["http://localhost:5173"]

  const isProduction = process.env.NODE_ENV === "production"

  function isLocalHttpOrigin(origin: string): boolean {
    try {
      const u = new URL(origin)
      return (
        u.protocol === "http:" &&
        (u.hostname === "localhost" || u.hostname === "127.0.0.1")
      )
    } catch {
      return false
    }
  }

  app.use(
    "*",
    cors({
      origin(origin) {
        if (!origin) {
          return "*"
        }
        if (corsOrigins.includes(origin)) {
          return origin
        }
        if (!isProduction && isLocalHttpOrigin(origin)) {
          return origin
        }
        return null
      },
    }),
  )

  app.use("*", async (c, next) => {
    const t0 = performance.now()
    await next()
    const durationMs = Math.round(performance.now() - t0)
    console.log(
      JSON.stringify({
        level: "info",
        event: "http_request",
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs,
      }),
    )
  })

  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      service: "bmad-todo-api",
      time: new Date().toISOString(),
    })
  })

  app.get("/todos", async (c) => {
    try {
      const rows = await db.select().from(todos).orderBy(desc(todos.createdAt))
      const list = rows.map((r) =>
        todoDtoSchema.parse({
          id: r.id,
          title: r.title,
          completed: r.completed,
          createdAt: r.createdAt,
        }),
      )
      const body = todosListResponseSchema.parse({ todos: list })
      return c.json(body)
    } catch (err) {
      logRouteError("todos_get_failed", err)
      return c.json(
        {
          error: {
            code: "INTERNAL",
            message: "Could not load todos.",
          },
        },
        500,
      )
    }
  })

  app.post("/todos", async (c) => {
    let jsonBody: unknown
    try {
      jsonBody = await c.req.json()
    } catch {
      return c.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Request body must be JSON",
          },
        },
        400,
      )
    }

    const parsed = createTodoBodySchema.safeParse(jsonBody)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input"
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: msg,
            details: { issues: parsed.error.flatten() },
          },
        },
        400,
      )
    }

    try {
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      await db.insert(todos).values({
        id,
        title: parsed.data.title,
        completed: false,
        createdAt,
      })

      const todo = todoDtoSchema.parse({
        id,
        title: parsed.data.title,
        completed: false,
        createdAt,
      })
      const payload = parseTodoSingleResponse({ todo })
      return c.json(payload, 201)
    } catch (err) {
      logRouteError("todos_post_failed", err)
      return c.json(
        {
          error: {
            code: "INTERNAL",
            message: "Could not create todo.",
          },
        },
        500,
      )
    }
  })

  app.patch("/todos/:id", async (c) => {
    const id = c.req.param("id")
    let jsonBody: unknown
    try {
      jsonBody = await c.req.json()
    } catch {
      return c.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Request body must be JSON",
          },
        },
        400,
      )
    }

    const parsed = patchTodoBodySchema.safeParse(jsonBody)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input"
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: msg,
            details: { issues: parsed.error.flatten() },
          },
        },
        400,
      )
    }

    try {
      const updated = await db
        .update(todos)
        .set({ completed: parsed.data.completed })
        .where(eq(todos.id, id))
        .returning()

      if (updated.length === 0) {
        return c.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Todo not found.",
            },
          },
          404,
        )
      }

      const row = updated[0]!
      const todo = todoDtoSchema.parse({
        id: row.id,
        title: row.title,
        completed: row.completed,
        createdAt: row.createdAt,
      })
      return c.json(parseTodoSingleResponse({ todo }))
    } catch (err) {
      logRouteError("todos_patch_failed", err)
      return c.json(
        {
          error: {
            code: "INTERNAL",
            message: "Could not update todo.",
          },
        },
        500,
      )
    }
  })

  app.delete("/todos/:id", async (c) => {
    const id = c.req.param("id")
    try {
      const removed = await db
        .delete(todos)
        .where(eq(todos.id, id))
        .returning({ id: todos.id })

      if (removed.length === 0) {
        return c.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Todo not found.",
            },
          },
          404,
        )
      }

      return new Response(null, { status: 204 })
    } catch (err) {
      logRouteError("todos_delete_failed", err)
      return c.json(
        {
          error: {
            code: "INTERNAL",
            message: "Could not delete todo.",
          },
        },
        500,
      )
    }
  })

  app.get("/", (c) => {
    return c.text("Hello Hono!")
  })

  return app
}
