import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { TodoDto } from "@/lib/todo-api"

import { EmptyState } from "./EmptyState"
import { ErrorBanner } from "./ErrorBanner"
import { LoadingSkeleton } from "./LoadingSkeleton"

function formatTodoCreatedAt(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d)
  } catch {
    return iso
  }
}

export type TodoListProps = {
  isPending: boolean
  isError: boolean
  isFetching: boolean
  error: Error | null
  listUserMessage?: string | null
  rowUserMessage?: string | null
  todos: TodoDto[]
  onRetry: () => void
  rowActionError: Error | null
  onRetryRowAction: () => void
  onDismissRowAction: () => void
  onToggleCompleted: (id: string, completed: boolean) => void
  onRequestDelete: (id: string, title: string) => void
  pendingToggleId: string | null
  pendingDeleteId: string | null
}

export function TodoList({
  isPending,
  isError,
  isFetching,
  error,
  listUserMessage,
  rowUserMessage,
  todos,
  onRetry,
  rowActionError,
  onRetryRowAction,
  onDismissRowAction,
  onToggleCompleted,
  onRequestDelete,
  pendingToggleId,
  pendingDeleteId,
}: TodoListProps) {
  const showSkeleton = isPending || (isError && isFetching)
  const showEmpty = !showSkeleton && !isError && todos.length === 0
  const showRows = !showSkeleton && !isError && todos.length > 0

  return (
    <section aria-label="Todo list" className="flex min-h-0 flex-1 flex-col gap-3">
      {isError ? (
        <ErrorBanner
          message={
            listUserMessage ??
            error?.message ??
            "Could not load todos."
          }
          onRetry={onRetry}
        />
      ) : null}
      {rowActionError && !isError ? (
        <ErrorBanner
          message={
            rowUserMessage ?? rowActionError.message
          }
          onRetry={() => {
            onDismissRowAction()
            onRetryRowAction()
          }}
        />
      ) : null}
      {showSkeleton ? <LoadingSkeleton /> : null}
      {showEmpty ? <EmptyState /> : null}
      {showRows ? (
        <ul
          aria-label={`Todo list, ${todos.length} task${todos.length === 1 ? "" : "s"}`}
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2"
        >
          {todos.map((todo) => {
            const busy =
              pendingToggleId === todo.id || pendingDeleteId === todo.id
            return (
              <li
                className="flex min-h-12 items-start gap-2 rounded-lg border border-transparent px-1 py-1 text-sm sm:gap-3 sm:px-2 sm:py-2"
                key={todo.id}
              >
                <label className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-start gap-2 sm:gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center">
                    <input
                      aria-label={`Mark “${todo.title}” ${todo.completed ? "incomplete" : "complete"}`}
                      checked={todo.completed}
                      className="size-5 rounded border border-input accent-primary motion-reduce:transition-none"
                      disabled={busy}
                      onChange={(e) => {
                        onToggleCompleted(todo.id, e.target.checked)
                      }}
                      type="checkbox"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={
                        todo.completed
                          ? "text-muted-foreground line-through decoration-2"
                          : "font-medium text-foreground"
                      }
                    >
                      {todo.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Added {formatTodoCreatedAt(todo.createdAt)}
                      {todo.completed ? " · Done" : ""}
                    </span>
                  </span>
                </label>
                <Button
                  aria-label={`Delete “${todo.title}”`}
                  className="size-11 min-h-11 min-w-11 shrink-0"
                  disabled={busy}
                  onClick={() => {
                    onRequestDelete(todo.id, todo.title)
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
