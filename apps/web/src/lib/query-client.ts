import { QueryClient } from "@tanstack/react-query"

/**
 * Query defaults for MVP list reads:
 * - `staleTime` avoids refetch thrash while navigating or remounting.
 * - `retry: 1` is safe for idempotent GETs (transient network blips only).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  })
}
