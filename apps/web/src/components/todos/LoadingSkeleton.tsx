export function LoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading todos"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      role="status"
    >
      {["s1", "s2", "s3", "s4"].map((id) => (
        <div
          key={id}
          className="h-12 rounded-lg bg-muted motion-reduce:animate-none motion-safe:animate-pulse"
        />
      ))}
    </div>
  )
}
