import { STATE_SHAPES } from "@/lib/geo";
import { heatColor, metricToT } from "@/lib/simulation";
import {
  ORIGIN_PLACE,
  PLACE_BY_ID,
  PLACES,
  hitPlaceDot,
  placeActive,
  residualActive,
  type MapPick,
} from "@/lib/prototype-map-look";
import { MapStage } from "@/components/map-look/map-stage";
import type { ReactNode } from "react";

type Props = {
  pick: MapPick | null;
  onPick: (pick: MapPick | null) => void;
  onMapTap?: (mx: number, my: number, scale: number) => boolean;
  drawCanvas?: (ctx: CanvasRenderingContext2D) => void;
  children?: ReactNode;
};

function dotR(pop: number) {
  return 3.2 + Math.sqrt(pop) / 900;
}

/** Locked look: Residual leftover fill + Place dots. Movement is the child's job. */
export function SchematicBase({ pick, onPick, onMapTap, drawCanvas, children }: Props) {
  return (
    <MapStage
      drawCanvas={drawCanvas}
      onTap={(mx, my, stateId, scale) => {
        const place = hitPlaceDot(mx, my, scale);
        if (place) {
          onPick({ kind: "place", id: place.id });
          return;
        }
        if (onMapTap?.(mx, my, scale)) return;
        if (stateId) onPick({ kind: "residual", state: stateId });
      }}
    >
      {STATE_SHAPES.map((sh) => {
        const sel = pick?.kind === "residual" && pick.state === sh.id;
        const t = residualActive(sh.id);
        return (
          <path
            key={sh.id}
            d={sh.d}
            fill={t > 0 ? heatColor(metricToT(t, "active")) : "#141210"}
            fillOpacity={t > 0 ? 0.55 : 1}
            stroke={sel ? "var(--color-fg)" : "#1f1c18"}
            strokeWidth={sel ? 1.4 : 0.4}
            className="pointer-events-none"
          />
        );
      })}
      {children}
      {PLACES.map((p) => {
        const sel = pick?.kind === "place" && pick.id === p.id;
        const origin = p.id === ORIGIN_PLACE;
        const active = placeActive(p.id);
        const r = dotR(p.pop);
        const fill = active > 0 ? heatColor(metricToT(active, "active")) : "#4a453c";
        return (
          <g key={p.id} className="pointer-events-none">
            <circle
              cx={p.x}
              cy={p.y}
              r={sel ? r + 1.6 : r}
              fill={fill}
              stroke={sel ? "var(--color-fg)" : origin ? "var(--color-infect-soft)" : "var(--color-bg)"}
              strokeWidth={sel || origin ? 1.4 : 0.6}
            />
            <text
              x={p.x}
              y={p.y + r + 8}
              textAnchor="middle"
              fill="var(--color-fg)"
              fontSize={7.5}
              fontFamily="IBM Plex Sans, sans-serif"
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </MapStage>
  );
}

export function placeName(id: string) {
  return PLACE_BY_ID[id]?.name ?? id;
}
