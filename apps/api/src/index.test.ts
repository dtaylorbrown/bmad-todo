import { test } from "node:test"
import assert from "node:assert/strict"
import Database from "better-sqlite3"

import { createApp } from "./create-app.js"

test("GET /health returns ok status payload", async () => {
  const sqlite = new Database(":memory:")
  const app = createApp(sqlite)
  const response = await app.request("/health")
  assert.equal(response.status, 200)
  const body = (await response.json()) as {
    status: string
    service: string
    time: string
  }
  assert.equal(body.status, "ok")
  assert.equal(body.service, "bmad-todo-api")
  assert.match(body.time, /^\d{4}-/)
  sqlite.close()
})
