import { STATE_SHAPES } from "@/lib/geo";
import { heatColor, metricToT } from "@/lib/simulation";
import {
  AIR_HOPS,
  ORIGIN_PLACE,
  PLACE_BY_ID,
  PLACES,
  ROAD_HOPS,
  hitPlaceDot,
  placeActive,
  residualActive,
  type MapPick,
} from "@/lib/prototype-map-look";
import { MapStage } from "./map-stage";

export const VARIANT_NETWORK_NAME = "Network";

type Props = {
  pick: MapPick | null;
  onPick: (pick: MapPick | null) => void;
};

function dotR(pop: number) {
  return 3.2 + Math.sqrt(pop) / 900;
}

function airArc(ax: number, ay: number, bx: number, by: number) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 - Math.hypot(bx - ax, by - ay) * 0.18;
  return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
}

/** U.S. scale: labeled Place dots, schematic Corridors, faint Residual wash. Infection is the dot. */
export function VariantNetwork({ pick, onPick }: Props) {
  return (
    <MapStage
      className=""
      onTap={(mx, my, stateId, scale) => {
        const place = hitPlaceDot(mx, my, scale);
        if (place) {
          onPick({ kind: "place", id: place.id });
          return;
        }
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
      {ROAD_HOPS.map((h) => {
        const A = PLACE_BY_ID[h.a];
        const B = PLACE_BY_ID[h.b];
        if (!A || !B) return null;
        return (
          <line
            key={`rd-${h.a}-${h.b}`}
            x1={A.x}
            y1={A.y}
            x2={B.x}
            y2={B.y}
            stroke="var(--color-warn)"
            strokeOpacity={0.55}
            strokeWidth={0.8 + h.w * 1.6}
            strokeLinecap="round"
            className="pointer-events-none"
          />
        );
      })}
      {AIR_HOPS.map((h) => {
        const A = PLACE_BY_ID[h.a];
        const B = PLACE_BY_ID[h.b];
        if (!A || !B) return null;
        return (
          <path
            key={`air-${h.a}-${h.b}`}
            d={airArc(A.x, A.y, B.x, B.y)}
            fill="none"
            stroke="var(--color-fg)"
            strokeOpacity={0.28}
            strokeWidth={0.5 + h.w * 0.9}
            className="pointer-events-none"
          />
        );
      })}
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
