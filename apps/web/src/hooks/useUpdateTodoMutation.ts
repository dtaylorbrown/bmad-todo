import type { TodosListResponse } from "@bmad-todo/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateTodo } from "@/lib/todo-api"

import { todosListQueryKey } from "./useTodosQuery"

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTodo(id, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: todosListQueryKey })
      const previous = queryClient.getQueryData<TodosListResponse>(
        todosListQueryKey,
      )
      queryClient.setQueryData<TodosListResponse>(todosListQueryKey, (old) => {
        if (!old) {
          return old
        }
        return {
          todos: old.todos.map((t) =>
            t.id === id ? { ...t, completed } : t,
          ),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(todosListQueryKey, ctx.previous)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: todosListQueryKey })
    },
  })
}
