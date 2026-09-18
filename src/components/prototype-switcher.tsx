import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type PrototypeVariant = { key: string; name: string };

type Props = {
  variants: PrototypeVariant[];
  current: string;
  onChange: (key: string) => void;
};

/** Floating prototype chrome. Hidden in production builds. */
export function PrototypeSwitcher({ variants, current, onChange }: Props) {
  const i = Math.max(0, variants.findIndex((v) => v.key === current));
  const label = variants[i] ?? variants[0];

  function cycle(dir: -1 | 1) {
    const next = variants[(i + dir + variants.length) % variants.length];
    if (next) onChange(next.key);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const next = variants[(i - 1 + variants.length) % variants.length];
        if (next) onChange(next.key);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = variants[(i + 1) % variants.length];
        if (next) onChange(next.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, variants, onChange]);

  if (import.meta.env.PROD) return null;

  return (
    <div
      data-pin="ui"
      className={cn(
        "pointer-events-auto fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1",
        "rounded-full bg-fg px-1.5 py-1 text-primary-fg shadow-[0_8px_32px_rgb(0_0_0/0.45)]",
      )}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="grid size-9 place-items-center rounded-full hover:bg-primary-fg/10"
        aria-label="Previous variant"
        onClick={() => cycle(-1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="min-w-[11rem] px-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary-fg/55">
          Prototype
        </p>
        <p className="text-sm font-medium leading-tight">
          {label?.key} — {label?.name}
        </p>
      </div>
      <button
        type="button"
        className="grid size-9 place-items-center rounded-full hover:bg-primary-fg/10"
        aria-label="Next variant"
        onClick={() => cycle(1)}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
