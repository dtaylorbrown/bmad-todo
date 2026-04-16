import { useQuery } from "@tanstack/react-query"

import { fetchTodos } from "@/lib/todo-api"

/**
 * Stable query key for the todo list. Reuse this constant when invalidating
 * after mutations (e.g. Story 1.3 create).
 */
export const todosListQueryKey = ["todos", "list"] as const

export function useTodosQuery() {
  return useQuery({
    queryKey: todosListQueryKey,
    queryFn: fetchTodos,
  })
}
