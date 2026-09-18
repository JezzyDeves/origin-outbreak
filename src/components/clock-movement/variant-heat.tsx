import { SkipForward } from "lucide-react";
import {
  DRAWN_HOPS,
  airPath,
  hopVolume,
  type ClockRateId,
} from "@/lib/prototype-clock-movement";
import type { MapPick } from "@/lib/prototype-map-look";
import { cn } from "@/lib/cn";
import { SchematicBase } from "./schematic-base";
import { StateDump } from "./state-dump";
import type { PrototypeClock } from "./use-prototype-clock";

export const VARIANT_HEAT_NAME = "Heat";

type Props = {
  clock: PrototypeClock;
  pick: MapPick | null;
  onPick: (pick: MapPick | null) => void;
};

/** Rate dial is the Clock. Movement is Corridor band width. 1 day / sec is frozen heat. */
export function VariantHeat({ clock, pick, onPick }: Props) {
  const animateBands = clock.rate !== "day" && clock.playing;
  const dash = animateBands ? 6 + clock.phase * 18 : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-end gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
            Prototype · Clock / Movement
          </p>
          <p className="font-display text-lg font-medium leading-tight">Heat</p>
        </div>
        <button
          type="button"
          className="h-9 rounded-full bg-elevated px-3 font-mono text-[11px] text-muted"
          onClick={() => clock.setPlaying(!clock.playing)}
        >
          {clock.playing ? "Halt" : "Run"}
        </button>
        <button
          type="button"
          aria-label="Skip week"
          onClick={clock.skipWeek}
          className="grid size-9 place-items-center rounded-full bg-elevated text-fg"
        >
          <SkipForward className="size-4" />
        </button>
        <p className="font-mono text-xs tabular-nums text-muted">Day {clock.day}</p>
      </header>

      <div className="relative mx-3 mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <SchematicBase pick={pick} onPick={onPick}>
          {DRAWN_HOPS.map((h) => {
            const vol = hopVolume(h);
            if (h.kind === "road") {
              return (
                <line
                  key={`rd-${h.a}-${h.b}`}
                  x1={h.ax}
                  y1={h.ay}
                  x2={h.bx}
                  y2={h.by}
                  stroke="var(--color-warn)"
                  strokeOpacity={0.7}
                  strokeWidth={0.8 + Math.sqrt(vol) / 28}
                  strokeLinecap="round"
                  className="pointer-events-none"
                />
              );
            }
            return (
              <path
                key={`air-${h.a}-${h.b}`}
                d={airPath(h.ax, h.ay, h.bx, h.by)}
                fill="none"
                stroke="var(--color-fg)"
                strokeOpacity={0.4}
                strokeWidth={0.5 + Math.sqrt(vol) / 40}
                strokeDasharray={animateBands ? "5 7" : undefined}
                strokeDashoffset={animateBands ? dash : undefined}
                className="pointer-events-none"
              />
            );
          })}
        </SchematicBase>
        <StateDump
          clock={clock}
          pick={pick}
          hop={null}
          note="B — band width. Four rates as the Clock. Day/sec is static."
        />
        <div
          data-pin="ui"
          className="absolute inset-x-3 bottom-3 z-20 rounded-2xl bg-bg/90 p-2 backdrop-blur-sm"
        >
          <p className="px-1 pb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-subtle">
            Clock rate
          </p>
          <div className="relative grid grid-cols-4 gap-1">
            <div className="pointer-events-none absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-border" />
            {clock.rates.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => clock.setRate(r.id as ClockRateId)}
                className="relative z-10 flex flex-col items-center gap-1 py-1"
              >
                <span
                  className={cn(
                    "size-3 rounded-full",
                    clock.rate === r.id ? "bg-fg" : "bg-elevated shadow-[var(--shadow-border)]",
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    clock.rate === r.id ? "text-fg" : "text-subtle",
                  )}
                >
                  {r.short}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-[4.5rem]" />
    </div>
  );
}
