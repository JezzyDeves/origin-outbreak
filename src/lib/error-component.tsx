import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-infect" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-lg font-medium">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {error.message || "An unexpected error occurred. Try reloading the page."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 h-11 rounded-xl bg-elevated px-5 text-sm font-medium text-fg shadow-[var(--shadow-border)]"
      >
        Try again
      </button>
    </main>
  );
}

export function AppNotFoundComponent() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-subtle">Origin</p>
      <h1 className="font-display text-lg font-medium">Page not found</h1>
      <p className="max-w-md text-sm text-muted">That path isn't part of this lab.</p>
      <Link
        to="/"
        className="mt-2 grid h-11 place-items-center rounded-xl bg-elevated px-5 text-sm font-medium text-fg shadow-[var(--shadow-border)]"
      >
        Back to the lab
      </Link>
    </main>
  );
}
