/**
 * Three variants of Places/Corridors look, switchable via `?variant=`, on the existing `/` map surface.
 * Throwaway. Do not merge to main.
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { VariantAtlas } from "@/components/map-look/variant-atlas";
import { VariantNetwork } from "@/components/map-look/variant-network";
import { VariantMegalopolis } from "@/components/map-look/variant-megalopolis";
import {
  ORIGIN_PLACE,
  PLACE_BY_ID,
  pickActive,
  pickLabel,
  placesHit,
  residualsHit,
  type MapPick,
} from "@/lib/prototype-map-look";
import { formatCompact } from "@/lib/states";

export const MAP_LOOK_VARIANTS = [
  { key: "A", name: "Atlas" },
  { key: "B", name: "Network" },
  { key: "C", name: "Megalopolis" },
] as const;

export type MapLookKey = (typeof MAP_LOOK_VARIANTS)[number]["key"];

type Props = {
  variant: MapLookKey;
  onVariant: (key: MapLookKey) => void;
};

export function MapLookPrototype({ variant, onVariant }: Props) {
  const [pick, setPick] = useState<MapPick | null>({ kind: "place", id: ORIGIN_PLACE });
  const origin = PLACE_BY_ID[ORIGIN_PLACE];
  const active = pickActive(pick);
  const name = MAP_LOOK_VARIANTS.find((v) => v.key === variant)?.name ?? variant;

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
            Prototype · map look
          </p>
          <p className="truncate font-display text-lg font-medium leading-tight">NOV-26</p>
          <p className="font-mono text-[11px] tabular-nums text-muted">Day 38 · canned infection</p>
        </div>
        <Badge tone="infect">Place / Residual fill</Badge>
      </header>

      <div className="grid grid-cols-4 gap-1 px-3 pt-2">
        <Hud k="Places hit" v={`${placesHit()} / 23`} />
        <Hud k="Residuals hit" v={`${residualsHit()}`} />
        <Hud k="Origin" v={origin?.name ?? "—"} />
        <Hud k="Selected" v={formatCompact(active)} tone="infect" />
      </div>

      <div className="relative mx-3 mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <div className="absolute inset-0">
          {variant === "A" ? <VariantAtlas pick={pick} onPick={setPick} /> : null}
          {variant === "B" ? <VariantNetwork pick={pick} onPick={setPick} /> : null}
          {variant === "C" ? <VariantMegalopolis pick={pick} onPick={setPick} /> : null}
        </div>

        <aside
          data-pin="ui"
          className="pointer-events-none absolute left-2 top-2 z-20 max-w-[16rem] rounded-xl bg-bg/85 px-3 py-2 font-mono text-[10px] leading-relaxed text-muted backdrop-blur-sm"
        >
          <p className="text-subtle">variant {variant} — {name}</p>
          <p className="text-fg">{pickLabel(pick)}</p>
          <p>active {formatCompact(active)}</p>
          <p>camera {variant === "C" ? "Northeast zoom" : "U.S. scale"}</p>
          <p className="mt-1 text-subtle">
            {variant === "A" && "polygons + Residual leftover + real highways. Fill only."}
            {variant === "B" && "labeled dots + schematic hops. Residual is a faint wash."}
            {variant === "C" && "zoomed polygons + ribbons. Fill and a city dot."}
          </p>
        </aside>
      </div>

      <p className="px-4 pb-[4.5rem] pt-2 text-center text-[11px] text-subtle">
        Tap a Place blob or leftover State land. Arrow keys flip variants. Not the game.
      </p>

      <PrototypeSwitcher
        variants={[...MAP_LOOK_VARIANTS]}
        current={variant}
        onChange={(key) => onVariant(key as MapLookKey)}
      />
    </div>
  );
}

function Hud({ k, v, tone }: { k: string; v: string; tone?: "infect" }) {
  return (
    <div className="rounded-lg bg-elevated px-2 py-1.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-subtle">{k}</p>
      <p className={`font-display text-base leading-tight ${tone === "infect" ? "text-infect-soft" : ""}`}>
        {v}
      </p>
    </div>
  );
}
