import { useState } from "react";
import { Pause, Play, SkipForward, StepForward } from "lucide-react";
import { formatCompact } from "@/lib/states";
import {
  DRAWN_HOPS,
  airPath,
  hitCorridor,
  hopLabel,
  hopsForPlace,
  type ClockRateId,
  type DrawnHop,
} from "@/lib/prototype-clock-movement";
import { PLACE_BY_ID, type MapPick } from "@/lib/prototype-map-look";
import { cn } from "@/lib/cn";
import { SchematicBase, placeName } from "./schematic-base";
import { StateDump } from "./state-dump";
import type { PrototypeClock } from "./use-prototype-clock";

export const VARIANT_LEDGER_NAME = "Ledger";

type Props = {
  clock: PrototypeClock;
  pick: MapPick | null;
  onPick: (pick: MapPick | null) => void;
};

/** Calendar-first Clock. Movement is numbers. Map hops stay hairline. */
export function VariantInspector({ clock, pick, onPick }: Props) {
  const [hop, setHop] = useState<DrawnHop | null>(null);
  const placeId = pick?.kind === "place" ? pick.id : null;
  const rows = placeId ? hopsForPlace(placeId) : hop ? [hop] : [];
  const share = clock.rate === "day" ? 1 : clock.phase;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
          Prototype · Clock / Movement
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-3xl font-medium leading-none">Day {clock.day}</p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              {clock.rate === "day"
                ? "Daily totals"
                : `${clock.hourOfDay.toFixed(1)} h into this Sim step`}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label={clock.playing ? "Pause" : "Play"}
              onClick={clock.togglePlaying}
              className="grid size-12 place-items-center rounded-xl bg-primary text-primary-fg"
            >
              {clock.playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
            </button>
            <button
              type="button"
              aria-label="Advance one Sim step"
              onClick={clock.stepDay}
              className="grid size-12 place-items-center rounded-xl bg-elevated text-fg"
            >
              <StepForward className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Skip week"
              onClick={clock.skipWeek}
              className="grid size-12 place-items-center rounded-xl bg-elevated text-fg"
            >
              <SkipForward className="size-5" />
            </button>
          </div>
        </div>
        <ol className="mt-2 grid max-w-md grid-cols-4 gap-1">
          {clock.rates.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => clock.setRate(r.id as ClockRateId)}
                className={cn(
                  "h-12 w-full rounded-lg px-1 text-left",
                  clock.rate === r.id ? "bg-elevated text-fg" : "text-subtle",
                )}
              >
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em]">
                  {r.short}
                </span>
                <span className="block truncate text-[11px] leading-tight">{r.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="relative mx-3 mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <SchematicBase
          pick={pick}
          onPick={(next) => {
            setHop(null);
            onPick(next);
          }}
          onMapTap={(mx, my, scale) => {
            const hit = hitCorridor(mx, my, scale);
            if (hit) {
              setHop(hit);
              onPick(null);
              return true;
            }
            return false;
          }}
        >
          {DRAWN_HOPS.map((h) => {
            const sel =
              hop?.a === h.a && hop?.b === h.b && hop.kind === h.kind
                ? true
                : placeId
                  ? h.a === placeId || h.b === placeId
                  : false;
            const road = h.kind === "road";
            const common = {
              stroke: sel ? (road ? "var(--color-warn)" : "var(--color-fg)") : "var(--color-subtle)",
              strokeOpacity: sel ? 0.95 : 0.35,
              strokeWidth: sel ? 1.8 : 0.55,
              className: "pointer-events-none",
            };
            if (road) {
              return (
                <line
                  key={`rd-${h.a}-${h.b}`}
                  x1={h.ax}
                  y1={h.ay}
                  x2={h.bx}
                  y2={h.by}
                  strokeLinecap="round"
                  {...common}
                />
              );
            }
            return (
              <path
                key={`air-${h.a}-${h.b}`}
                d={airPath(h.ax, h.ay, h.bx, h.by)}
                fill="none"
                {...common}
              />
            );
          })}
        </SchematicBase>
        <StateDump
          clock={clock}
          pick={pick}
          hop={hop}
          note="C — numbers. Map is quiet. Clock is the date."
        />
      </div>

      <div className="px-3 pb-[4.5rem] pt-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-subtle">
          Movement ledger
        </p>
        <p className="text-sm text-fg">
          {placeId
            ? PLACE_BY_ID[placeId]?.name
            : hop
              ? hopLabel(hop)
              : "Tap a Place or Corridor"}
        </p>
        <div className="mt-1 max-h-36 space-y-1 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-xs text-subtle">No Movement selected.</p>
          ) : (
            rows.map((h) => {
              const daily = h.kind === "road" ? h.trips : h.paxAB + h.paxBA;
              const shown = Math.round(daily * share);
              const other = h.a === placeId ? h.b : h.a;
              return (
                <div
                  key={`${h.kind}-${h.a}-${h.b}`}
                  className="flex items-baseline justify-between gap-2 font-mono text-[11px]"
                >
                  <span className="truncate text-muted">
                    {h.kind === "road" ? "Road" : "Air"} · {placeName(other)}
                  </span>
                  <span className="tabular-nums text-fg">
                    {formatCompact(shown)}
                    {clock.rate === "day" ? "" : " so far"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
