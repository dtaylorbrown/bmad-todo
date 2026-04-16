export function EmptyState() {
  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center"
      role="status"
    >
      <p className="text-sm font-medium text-foreground">No todos yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first task using the field above.
      </p>
    </div>
  )
}
