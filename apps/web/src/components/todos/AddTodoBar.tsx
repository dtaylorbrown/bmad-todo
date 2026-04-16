import { createTodoBodySchema } from "@bmad-todo/shared"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"

export type AddTodoBarProps = {
  onAdd: (title: string) => Promise<void>
  isSubmitting: boolean
  submitError: Error | null
  submitErrorMessage?: string | null
  onDismissSubmitError?: () => void
  onRetrySubmit?: () => void
}

export function AddTodoBar({
  onAdd,
  isSubmitting,
  submitError,
  submitErrorMessage,
  onDismissSubmitError,
  onRetrySubmit,
}: AddTodoBarProps) {
  const [title, setTitle] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = createTodoBodySchema.safeParse({ title })
    if (!parsed.success) {
      const msg =
        parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid title"
      setLocalError(msg)
      return
    }
    setLocalError(null)
    try {
      await onAdd(parsed.data.title)
      setTitle("")
    } catch {
      /* mutation error surfaced via submitError */
    }
  }

  return (
    <section
      aria-label="Add a todo"
      className="rounded-xl border border-border bg-card p-3 shadow-sm"
    >
      <form className="flex flex-col gap-2" onSubmit={(e) => void handleSubmit(e)}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              className="mb-1 block text-xs font-medium text-muted-foreground"
              htmlFor="new-todo"
            >
              New task
            </label>
            <input
              autoComplete="off"
              className="h-11 w-full min-h-11 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={isSubmitting}
              id="new-todo"
              name="new-todo"
              onChange={(ev) => {
                setTitle(ev.target.value)
                setLocalError(null)
                onDismissSubmitError?.()
              }}
              placeholder="What needs doing?"
              type="text"
              value={title}
            />
          </div>
          <Button
            className="h-11 min-h-11 min-w-11 shrink-0 px-4 sm:min-w-24"
            disabled={isSubmitting}
            type="submit"
          >
            Add
          </Button>
        </div>
        {localError ? (
          <p className="text-sm text-destructive" role="alert">
            {localError}
          </p>
        ) : null}
        {submitError && !localError ? (
          <div className="flex flex-col gap-2" role="alert">
            <p className="text-sm text-destructive">
              {submitErrorMessage ?? submitError.message}
            </p>
            {onRetrySubmit ? (
              <Button
                className="min-h-11 w-fit"
                onClick={() => {
                  void onRetrySubmit()
                }}
                type="button"
                variant="outline"
              >
                Try again
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </section>
  )
}
