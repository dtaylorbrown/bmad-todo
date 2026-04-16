import { test } from "node:test"
import assert from "node:assert/strict"
import Database from "better-sqlite3"
import {
  createTodoBodySchema,
  todosListResponseSchema,
  todoSingleResponseSchema,
} from "@bmad-todo/shared"

import { createApp } from "./create-app.js"

function memoryApp() {
  const sqlite = new Database(":memory:")
  return { app: createApp(sqlite), sqlite }
}

test("GET /todos returns 200 and body matching list response schema", async () => {
  const { app, sqlite } = memoryApp()
  const response = await app.request("/todos")
  assert.equal(response.status, 200)
  const json: unknown = await response.json()
  const parsed = todosListResponseSchema.safeParse(json)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.deepEqual(parsed.data.todos, [])
  }
  sqlite.close()
})

test("POST /todos creates a row and GET returns it newest-first", async () => {
  const { app, sqlite } = memoryApp()
  const post = await app.request("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "  Buy milk  " }),
  })
  assert.equal(post.status, 201)
  const created: unknown = await post.json()
  const one = todoSingleResponseSchema.safeParse(created)
  assert.equal(one.success, true)
  if (one.success) {
    assert.equal(one.data.todo.title, "Buy milk")
    assert.equal(one.data.todo.completed, false)
    assert.match(one.data.todo.id, /^[0-9a-f-]{36}$/i)
    assert.match(one.data.todo.createdAt, /^\d{4}-/)
  }

  const list = await app.request("/todos")
  assert.equal(list.status, 200)
  const listJson: unknown = await list.json()
  const listParsed = todosListResponseSchema.safeParse(listJson)
  assert.equal(listParsed.success, true)
  if (listParsed.success) {
    assert.equal(listParsed.data.todos.length, 1)
    assert.equal(listParsed.data.todos[0]?.title, "Buy milk")
  }

  sqlite.close()
})

test("POST /todos with empty title returns 400 validation envelope", async () => {
  const { app, sqlite } = memoryApp()
  const post = await app.request("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "   " }),
  })
  assert.equal(post.status, 400)
  const body: unknown = await post.json()
  assert.deepEqual(
    typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: { code?: string } }).error?.code === "string",
    true,
  )
  assert.equal((body as { error: { code: string } }).error.code, "VALIDATION_ERROR")
  sqlite.close()
})

test("createTodoBodySchema trims and validates", () => {
  const ok = createTodoBodySchema.safeParse({ title: "  x  " })
  assert.equal(ok.success, true)
  if (ok.success) assert.equal(ok.data.title, "x")
  const bad = createTodoBodySchema.safeParse({ title: "" })
  assert.equal(bad.success, false)
})

test("PATCH /todos/:id toggles completed and GET reflects it", async () => {
  const { app, sqlite } = memoryApp()
  const post = await app.request("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Toggle me" }),
  })
  assert.equal(post.status, 201)
  const created: unknown = await post.json()
  const one = todoSingleResponseSchema.safeParse(created)
  assert.equal(one.success, true)
  if (!one.success) throw new Error("parse")
  const id = one.data.todo.id

  const patch = await app.request(`/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: true }),
  })
  assert.equal(patch.status, 200)
  const patched: unknown = await patch.json()
  const p2 = todoSingleResponseSchema.safeParse(patched)
  assert.equal(p2.success, true)
  if (p2.success) {
    assert.equal(p2.data.todo.completed, true)
    assert.equal(p2.data.todo.title, "Toggle me")
  }

  const list = await app.request("/todos")
  const listJson: unknown = await list.json()
  const listParsed = todosListResponseSchema.safeParse(listJson)
  assert.equal(listParsed.success, true)
  if (listParsed.success) {
    assert.equal(listParsed.data.todos[0]?.completed, true)
  }

  sqlite.close()
})

test("PATCH /todos/:id returns 404 for unknown id", async () => {
  const { app, sqlite } = memoryApp()
  const patch = await app.request(
    "/todos/00000000-0000-4000-8000-000000000001",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    },
  )
  assert.equal(patch.status, 404)
  sqlite.close()
})

test("DELETE /todos/:id removes row and GET returns empty", async () => {
  const { app, sqlite } = memoryApp()
  const post = await app.request("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Remove me" }),
  })
  assert.equal(post.status, 201)
  const created: unknown = await post.json()
  const one = todoSingleResponseSchema.safeParse(created)
  assert.equal(one.success, true)
  if (!one.success) throw new Error("parse")
  const id = one.data.todo.id

  const del = await app.request(`/todos/${id}`, { method: "DELETE" })
  assert.equal(del.status, 204)

  const list = await app.request("/todos")
  const listJson: unknown = await list.json()
  const listParsed = todosListResponseSchema.safeParse(listJson)
  assert.equal(listParsed.success, true)
  if (listParsed.success) {
    assert.equal(listParsed.data.todos.length, 0)
  }

  sqlite.close()
})

test("DELETE /todos/:id returns 404 for unknown id", async () => {
  const { app, sqlite } = memoryApp()
  const del = await app.request(
    "/todos/00000000-0000-4000-8000-000000000002",
    { method: "DELETE" },
  )
  assert.equal(del.status, 404)
  sqlite.close()
})
