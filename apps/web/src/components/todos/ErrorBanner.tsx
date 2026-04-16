import { Button } from "@/components/ui/button"

type ErrorBannerProps = {
  message: string
  onRetry: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm text-foreground">{message}</p>
      <Button
        className="min-h-11 min-w-[5.5rem] shrink-0 self-start sm:self-auto"
        onClick={onRetry}
        type="button"
        variant="outline"
      >
        Retry
      </Button>
    </div>
  )
}
