import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { serve } from "@hono/node-server"
import type { Hono } from "hono"
import Database from "better-sqlite3"

import { createApp } from "./create-app.js"

function openAppOrExit(): Hono {
  const dbPath = process.env.SQLITE_PATH ?? join(process.cwd(), "data", "todos.db")
  try {
    mkdirSync(dirname(dbPath), { recursive: true })
    const sqlite = new Database(dbPath)
    return createApp(sqlite)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(
      `[bmad-todo] Cannot open or migrate the todo database at ${dbPath}: ${detail}`,
    )
    process.exit(1)
  }
}

export const app = openAppOrExit()

function listenPort(): number {
  const raw = process.env.PORT
  if (raw === undefined || raw.trim() === "") {
    return 3001
  }
  const n = Number(raw.trim())
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(
      `PORT must be an integer between 1 and 65535, received: ${JSON.stringify(raw)}`,
    )
  }
  return n
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], "file:").href

if (isDirectExecution) {
  let port: number
  try {
    port = listenPort()
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`[bmad-todo] Cannot start API server: ${detail}`)
    process.exit(1)
  }

  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`)
    },
  )
}
