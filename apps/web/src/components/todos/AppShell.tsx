import type { ReactNode } from "react"

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-foreground">
      <a
        className="pointer-events-none fixed top-0 left-4 z-[100] -translate-y-full rounded-b-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground opacity-0 shadow-md transition-[transform,opacity] focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        href="#main-content"
      >
        Skip to main content
      </a>
      <main
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6 sm:max-w-xl sm:px-6 md:max-w-2xl md:gap-5 md:py-8"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  )
}
