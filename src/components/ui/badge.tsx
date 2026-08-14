import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Badge({
  className,
  tone = "muted",
  ...props
}: ComponentProps<"span"> & { tone?: "muted" | "infect" | "ok" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
        tone === "muted" && "bg-elevated text-muted",
        tone === "infect" && "bg-infect-deep text-infect-soft",
        tone === "ok" && "bg-elevated text-ok",
        tone === "warn" && "bg-elevated text-warn",
        className,
      )}
      {...props}
    />
  );
}
