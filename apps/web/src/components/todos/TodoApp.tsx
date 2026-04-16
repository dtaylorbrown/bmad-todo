import { useCreateTodoMutation } from "@/hooks/useCreateTodoMutation"
import { useDeleteTodoMutation } from "@/hooks/useDeleteTodoMutation"
import { useTodosQuery } from "@/hooks/useTodosQuery"
import { useUpdateTodoMutation } from "@/hooks/useUpdateTodoMutation"
import { userFacingRequestError } from "@/lib/user-facing-error"

import { AddTodoBar } from "./AddTodoBar"
import { AppShell } from "./AppShell"
import { TodoList } from "./TodoList"

export function TodoApp() {
  const { data, isPending, isError, isFetching, error, refetch } = useTodosQuery()
  const createTodoMutation = useCreateTodoMutation()
  const updateTodoMutation = useUpdateTodoMutation()
  const deleteTodoMutation = useDeleteTodoMutation()

  const rowActionError =
    updateTodoMutation.isError && updateTodoMutation.error
      ? updateTodoMutation.error
      : deleteTodoMutation.isError && deleteTodoMutation.error
        ? deleteTodoMutation.error
        : null

  const pendingToggleId =
    updateTodoMutation.isPending && updateTodoMutation.variables
      ? updateTodoMutation.variables.id
      : null

  const pendingDeleteId =
    deleteTodoMutation.isPending && deleteTodoMutation.variables
      ? deleteTodoMutation.variables
      : null

  const listUserMessage =
    isError && error ? userFacingRequestError(error) : null
  const rowUserMessage = rowActionError
    ? userFacingRequestError(rowActionError)
    : null

  return (
    <AppShell>
      <AddTodoBar
        isSubmitting={createTodoMutation.isPending}
        onAdd={async (t) => {
          await createTodoMutation.mutateAsync(t)
        }}
        onDismissSubmitError={() => {
          createTodoMutation.reset()
        }}
        onRetrySubmit={() => {
          const title = createTodoMutation.variables
          if (typeof title === "string" && title.length > 0) {
            void createTodoMutation.mutateAsync(title)
          }
        }}
        submitError={
          createTodoMutation.isError ? createTodoMutation.error : null
        }
        submitErrorMessage={
          createTodoMutation.isError
            ? userFacingRequestError(createTodoMutation.error)
            : null
        }
      />
      <TodoList
        error={error}
        isError={isError}
        isFetching={isFetching}
        isPending={isPending}
        listUserMessage={listUserMessage}
        onDismissRowAction={() => {
          updateTodoMutation.reset()
          deleteTodoMutation.reset()
        }}
        onRequestDelete={(id, title) => {
          if (
            !window.confirm(`Delete “${title}”? This cannot be undone.`)
          ) {
            return
          }
          deleteTodoMutation.reset()
          deleteTodoMutation.mutate(id)
        }}
        onRetry={() => {
          void refetch()
        }}
        onRetryRowAction={() => {
          void refetch()
        }}
        rowUserMessage={rowUserMessage}
        onToggleCompleted={(id, completed) => {
          updateTodoMutation.reset()
          updateTodoMutation.mutate({ id, completed })
        }}
        pendingDeleteId={pendingDeleteId}
        pendingToggleId={pendingToggleId}
        rowActionError={rowActionError}
        todos={data?.todos ?? []}
      />
    </AppShell>
  )
}
