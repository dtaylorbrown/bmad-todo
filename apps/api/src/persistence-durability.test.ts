import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import assert from "node:assert/strict"
import Database from "better-sqlite3"
import { todosListResponseSchema } from "@bmad-todo/shared"

import { createApp } from "./create-app.js"

test("todos persist across closed DB connections on the same file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bmad-todo-persist-"))
  const dbFile = join(dir, "todos.db")
  let sqlite1: Database | undefined
  let sqlite2: Database | undefined
  try {
    sqlite1 = new Database(dbFile)
    const app1 = createApp(sqlite1)
    const post = await app1.request("/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Survives reconnect" }),
    })
    assert.equal(post.status, 201)
    sqlite1.close()
    sqlite1 = undefined

    sqlite2 = new Database(dbFile)
    const app2 = createApp(sqlite2)
    const list = await app2.request("/todos")
    assert.equal(list.status, 200)
    const body: unknown = await list.json()
    const parsed = todosListResponseSchema.safeParse(body)
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.todos.length, 1)
      assert.equal(parsed.data.todos[0]?.title, "Survives reconnect")
    }
    sqlite2.close()
    sqlite2 = undefined
  } finally {
    for (const db of [sqlite1, sqlite2]) {
      if (!db) continue
      try {
        db.close()
      } catch {
        /* ignore cleanup errors */
      }
    }
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      /* ignore cleanup errors */
    }
  }
})
