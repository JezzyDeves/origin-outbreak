import { useCallback, useRef } from "react";
import { Pause, Play, SkipForward, StepForward } from "lucide-react";
import {
  DRAWN_HOPS,
  SIM_STEP_SECONDS,
  alongLine,
  alongQuad,
  particleCount,
  type ClockRateId,
} from "@/lib/prototype-clock-movement";
import type { MapPick } from "@/lib/prototype-map-look";
import { cn } from "@/lib/cn";
import { SchematicBase } from "./schematic-base";
import { StateDump } from "./state-dump";
import type { PrototypeClock } from "./use-prototype-clock";

export const VARIANT_CONVOY_NAME = "Convoy";

type Props = {
  clock: PrototypeClock;
  pick: MapPick | null;
  onPick: (pick: MapPick | null) => void;
};

function css(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Transport Clock + particles on schematic hops at every rate, including 1 day / sec. */
export function VariantConvoy({ clock, pick, onPick }: Props) {
  const clockRef = useRef(clock);
  clockRef.current = clock;

  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
    const c = clockRef.current;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phase = reduce ? 0.35 : (c.secondsRef.current % SIM_STEP_SECONDS) / SIM_STEP_SECONDS;
    const warn = css("--color-warn", "#c4a574");
    const fg = css("--color-fg", "#efe8dc");

    for (const h of DRAWN_HOPS) {
      if (h.kind === "road") {
        ctx.strokeStyle = warn;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 0.9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(h.ax, h.ay);
        ctx.lineTo(h.bx, h.by);
        ctx.stroke();
        const n = particleCount(h.trips);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = warn;
        for (let i = 0; i < n; i++) {
          const u = (phase + i / n) % 1;
          const p = alongLine(h.ax, h.ay, h.bx, h.by, u);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
          const q = alongLine(h.bx, h.by, h.ax, h.ay, u);
          ctx.beginPath();
          ctx.arc(q.x, q.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(h.ax, h.ay);
        ctx.quadraticCurveTo(h.cx, h.cy, h.bx, h.by);
        ctx.stroke();
        const n = particleCount(h.paxAB + h.paxBA);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = fg;
        for (let i = 0; i < n; i++) {
          const u = (phase + i / n) % 1;
          const p = alongQuad(h.ax, h.ay, h.cx, h.cy, h.bx, h.by, u);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
            Prototype · Clock / Movement
          </p>
          <p className="font-display text-lg font-medium leading-tight">Convoy</p>
        </div>
        <p className="font-mono text-xs tabular-nums text-muted">Day {clock.day}</p>
      </header>

      <div className="relative mx-3 mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <SchematicBase pick={pick} onPick={onPick} drawCanvas={drawCanvas} />
        <StateDump
          clock={clock}
          pick={pick}
          hop={null}
          note="A — particles on hops. Pause, step, skip, four rates."
        />
      </div>

      <div className="px-3 pb-[4.5rem] pt-2">
        <div className="grid grid-cols-4 gap-1">
          {clock.rates.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => clock.setRate(r.id as ClockRateId)}
              className={cn(
                "h-11 rounded-lg px-1 font-mono text-[11px] tabular-nums",
                clock.rate === r.id ? "bg-fg text-primary-fg" : "bg-elevated text-muted",
              )}
            >
              {r.short}
            </button>
          ))}
        </div>
        <div className="mt-1 flex items-center gap-1">
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
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-elevated text-sm"
          >
            <SkipForward className="size-4" />
            Skip week
          </button>
        </div>
      </div>
    </div>
  );
}
