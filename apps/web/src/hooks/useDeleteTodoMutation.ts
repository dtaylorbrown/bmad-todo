import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteTodo } from "@/lib/todo-api"

import { todosListQueryKey } from "./useTodosQuery"

export function useDeleteTodoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todosListQueryKey })
    },
  })
}
