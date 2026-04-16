import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createTodo } from "@/lib/todo-api"

import { todosListQueryKey } from "./useTodosQuery"

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => createTodo(title),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: todosListQueryKey })
    },
  })
}
