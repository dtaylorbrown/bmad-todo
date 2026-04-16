import { TodoFetchError } from "@/lib/todo-api"

/**
 * Maps API/network errors to stable, user-readable copy (Epic 3 — error contract in UI).
 */
export function userFacingRequestError(err: unknown): string {
  if (err instanceof TodoFetchError) {
    if (err.code === "NOT_FOUND") {
      return "That task is no longer on the server. Try refreshing the list."
    }
    if (err.code === "VALIDATION_ERROR" || err.code === "INVALID_JSON") {
      return err.message
    }
    if (err.status === 0) {
      return err.message
    }
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return "Something went wrong. You can try again."
}
