import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-border transition-colors duration-150 data-[state=checked]:bg-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-1 rounded-full bg-bg transition-transform duration-150 data-[state=checked]:translate-x-6 data-[state=checked]:bg-primary-fg" />
    </SwitchPrimitive.Root>
  );
}
