import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider } from "@/components/theme-provider.tsx"

import { TodoApp } from "./TodoApp"

const originalFetch = globalThis.fetch

function renderWithProviders(ui: ReactElement) {
  cleanup()
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
  return {
    ...render(
      <QueryClientProvider client={client}>
        <ThemeProvider defaultTheme="light">{ui}</ThemeProvider>
      </QueryClientProvider>,
    ),
    client,
  }
}

describe("TodoApp", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("offers a skip link to main content for keyboard users", () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ todos: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    renderWithProviders(<TodoApp />)
    const skip = screen.getByRole("link", {
      name: /skip to main content/i,
    })
    expect(skip).toHaveAttribute("href", "#main-content")
    expect(document.getElementById("main-content")).toBeTruthy()
  })

  it("shows loading skeleton while the initial fetch is pending", async () => {
    globalThis.fetch = vi.fn(
      () =>
        new Promise<Response>(() => {
          /* never resolves */
        }),
    )

    renderWithProviders(<TodoApp />)

    expect(
      await screen.findByRole("status", { name: /loading todos/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/new task/i)).toBeInTheDocument()
  })

  it("shows empty state when the list is empty", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ todos: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    renderWithProviders(<TodoApp />)

    await waitFor(() => {
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/add your first task/i)).toBeInTheDocument()
  })

  it("shows error banner with retry and refetches on retry", async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: "ERR", message: "Temporary failure" },
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ todos: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
    globalThis.fetch = fetchMock

    renderWithProviders(<TodoApp />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /temporary failure/i,
    )

    await user.click(screen.getByRole("button", { name: /^retry$/i }))

    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("shows inline validation for whitespace-only title and does not POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ todos: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    globalThis.fetch = fetchMock
    const user = userEvent.setup()
    renderWithProviders(<TodoApp />)

    await waitFor(() => {
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText(/new task/i), "   ")
    await user.click(screen.getByRole("button", { name: /^add$/i }))

    expect(
      screen.getByText(/title is required/i, { exact: false }),
    ).toBeInTheDocument()
    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "POST",
    )
    expect(postCalls).toHaveLength(0)
  })

  it("creates a todo and shows it after refetch", async () => {
    const todo = {
      id: "id-1",
      title: "Pick up bread",
      completed: false,
      createdAt: "2026-04-16T10:00:00.000Z",
    }
    let posted = false
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (!url.endsWith("/todos")) {
          throw new Error(`unexpected fetch url: ${url}`)
        }
        if (init?.method === "POST") {
          posted = true
          return new Response(JSON.stringify({ todo }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        }
        const todos = posted ? [todo] : []
        return new Response(JSON.stringify({ todos }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    )
    globalThis.fetch = fetchMock
    const user = userEvent.setup()
    renderWithProviders(<TodoApp />)

    await waitFor(() => {
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText(/new task/i), "Pick up bread")
    await user.click(screen.getByRole("button", { name: /^add$/i }))

    expect(await screen.findByText("Pick up bread")).toBeInTheDocument()
    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "POST",
    )
    expect(postCalls).toHaveLength(1)
  })

  it("after a successful create, a remounted app shows the same todo from the server", async () => {
    type TodoRow = {
      id: string
      title: string
      completed: boolean
      createdAt: string
    }
    const serverTodos: TodoRow[] = []
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (!url.endsWith("/todos")) {
          throw new Error(`unexpected fetch url: ${url}`)
        }
        if (init?.method === "POST") {
          const body = JSON.parse(String(init.body)) as { title: string }
          const todo: TodoRow = {
            id: "persisted-id",
            title: body.title.trim(),
            completed: false,
            createdAt: "2026-04-16T12:00:00.000Z",
          }
          serverTodos.push(todo)
          return new Response(JSON.stringify({ todo }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        }
        return new Response(JSON.stringify({ todos: [...serverTodos] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    )
    globalThis.fetch = fetchMock
    const user = userEvent.setup()

    const { unmount: unmountFirst } = renderWithProviders(<TodoApp />)
    await waitFor(() => {
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText(/new task/i), "Water plants")
    await user.click(screen.getByRole("button", { name: /^add$/i }))
    expect(await screen.findByText("Water plants")).toBeInTheDocument()
    unmountFirst()

    renderWithProviders(<TodoApp />)
    const listRegion = await screen.findByRole("region", { name: /todo list/i })
    expect(await within(listRegion).findByText("Water plants")).toBeInTheDocument()
  })

  it("toggles completion with PATCH and shows Done metadata", async () => {
    const base = {
      id: "t1",
      title: "Work out",
      completed: false,
      createdAt: "2026-04-16T15:00:00.000Z",
    }
    let snap = { ...base }
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (!url.includes("/todos")) {
          throw new Error(url)
        }
        if (init?.method === "PATCH") {
          const body = JSON.parse(String(init.body)) as { completed: boolean }
          snap = { ...snap, completed: body.completed }
          return new Response(JSON.stringify({ todo: snap }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }
        return new Response(JSON.stringify({ todos: [snap] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    )
    globalThis.fetch = fetchMock
    const user = userEvent.setup()
    renderWithProviders(<TodoApp />)
    await waitFor(() => {
      expect(screen.getByText("Work out")).toBeInTheDocument()
    })
    await user.click(
      screen.getByRole("checkbox", {
        name: /mark.*work out.*complete/i,
      }),
    )
    expect(await screen.findByText(/· Done/i)).toBeInTheDocument()
    const patchCalls = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "PATCH",
    )
    expect(patchCalls).toHaveLength(1)
  })

  it("rolls back toggle when PATCH fails and shows retry", async () => {
    const row = {
      id: "r1",
      title: "Err",
      completed: false,
      createdAt: "2026-04-16T10:00:00.000Z",
    }
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (!url.includes("/todos")) {
          throw new Error(url)
        }
        if (init?.method === "PATCH") {
          return new Response(
            JSON.stringify({
              error: { code: "ERR", message: "Cannot save toggle" },
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          )
        }
        return new Response(JSON.stringify({ todos: [row] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    )
    globalThis.fetch = fetchMock
    const user = userEvent.setup()
    renderWithProviders(<TodoApp />)
    await waitFor(() => {
      expect(screen.getByText("Err")).toBeInTheDocument()
    })
    await user.click(
      screen.getByRole("checkbox", { name: /mark.*err/i }),
    )
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /cannot save toggle/i,
    )
    const checkbox = screen.getByRole("checkbox", { name: /mark.*err/i })
    expect(checkbox).not.toBeChecked()
  })

  it("deletes a todo after confirm and clears the row", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    const row = {
      id: "del-1",
      title: "Remove me",
      completed: false,
      createdAt: "2026-04-16T11:00:00.000Z",
    }
    let list: typeof row[] = [row]
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "DELETE") {
          list = []
          return new Response(null, { status: 204 })
        }
        return new Response(JSON.stringify({ todos: list }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    )
    globalThis.fetch = fetchMock
    const user = userEvent.setup()
    renderWithProviders(<TodoApp />)
    await waitFor(() => {
      expect(screen.getByText("Remove me")).toBeInTheDocument()
    })
    await user.click(
      screen.getByRole("button", { name: /delete.*remove me/i }),
    )
    await waitFor(() => {
      expect(screen.queryByText("Remove me")).not.toBeInTheDocument()
    })
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE"),
    ).toBe(true)
  })

  it("offers try again after create fails and succeeds on retry", async () => {
    let posted = false
    let failNextPost = true
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "POST") {
          if (failNextPost) {
            failNextPost = false
            return new Response(
              JSON.stringify({
                error: { code: "ERR", message: "Save failed" },
              }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            )
          }
          posted = true
          return new Response(
            JSON.stringify({
              todo: {
                id: "n1",
                title: "Retry cake",
                completed: false,
                createdAt: "2026-04-16T12:00:00.000Z",
              },
            }),
            { status: 201, headers: { "Content-Type": "application/json" } },
          )
        }
        return new Response(
          JSON.stringify({
            todos: posted
              ? [
                  {
                    id: "n1",
                    title: "Retry cake",
                    completed: false,
                    createdAt: "2026-04-16T12:00:00.000Z",
                  },
                ]
              : [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      },
    )
    globalThis.fetch = fetchMock
    const user = userEvent.setup()
    renderWithProviders(<TodoApp />)

    await waitFor(() => {
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText(/new task/i), "Retry cake")
    await user.click(screen.getByRole("button", { name: /^add$/i }))
    expect(await screen.findByText(/save failed/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^try again$/i }))
    expect(await screen.findByText("Retry cake")).toBeInTheDocument()
    expect(posted).toBe(true)
  })
})
