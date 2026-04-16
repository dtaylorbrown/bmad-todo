import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  /** ISO-8601 string, set by application on insert */
  createdAt: text("created_at").notNull(),
})
