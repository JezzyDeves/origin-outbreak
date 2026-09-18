import { STATE_SHAPES } from "@/lib/geo";
import { heatColor, metricToT } from "@/lib/simulation";
import {
  AIR_HOPS,
  NE_FOCUS,
  ORIGIN_PLACE,
  PLACE_BY_ID,
  PLACES,
  ROAD_HOPS,
  hitPlace,
  placeActive,
  residualActive,
  type MapPick,
} from "@/lib/prototype-map-look";
import { MapStage } from "./map-stage";

export const VARIANT_MEGALOPOLIS_NAME = "Megalopolis";

const NE = new Set([
  "boston",
  "providence",
  "hartford",
  "newyork",
  "philadelphia",
  "baltimore",
  "washington",
]);

type Props = {
  pick: MapPick | null;
  onPick: (pick: MapPick | null) => void;
};

function fillFor(active: number, empty: string) {
  if (active <= 0) return empty;
  return heatColor(metricToT(active, "active"));
}

function ribbon(ax: number, ay: number, bx: number, by: number, width: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * width;
  const ny = (dx / len) * width;
  return `M ${ax + nx} ${ay + ny} L ${bx + nx} ${by + ny} L ${bx - nx} ${by - ny} L ${ax - nx} ${ay - ny} Z`;
}

/** Northeast zoom: Place polygons + always-on labels, schematic Corridor ribbons, fill AND city dots. */
export function VariantMegalopolis({ pick, onPick }: Props) {
  const neRoads = ROAD_HOPS.filter((h) => NE.has(h.a) && NE.has(h.b));
  const neAir = AIR_HOPS.filter((h) => NE.has(h.a) || NE.has(h.b));

  return (
    <MapStage
      className=""
      focus={NE_FOCUS}
      onTap={(mx, my, stateId) => {
        const place = hitPlace(mx, my);
        if (place) {
          onPick({ kind: "place", id: place.id });
          return;
        }
        if (stateId) onPick({ kind: "residual", state: stateId });
      }}
    >
      {STATE_SHAPES.map((sh) => {
        const sel = pick?.kind === "residual" && pick.state === sh.id;
        return (
          <path
            key={sh.id}
            d={sh.d}
            fill={fillFor(residualActive(sh.id), "#1c1916")}
            stroke={sel ? "var(--color-fg)" : "#0e0d0b"}
            strokeWidth={sel ? 1.8 : 0.6}
            className="pointer-events-none"
          />
        );
      })}
      {PLACES.map((p) => {
        const sel = pick?.kind === "place" && pick.id === p.id;
        const origin = p.id === ORIGIN_PLACE;
        const active = placeActive(p.id);
        const inFrame = NE.has(p.id);
        return (
          <ellipse
            key={p.id}
            cx={p.x}
            cy={p.y}
            rx={p.rx}
            ry={p.ry}
            transform={`rotate(${p.rot} ${p.x} ${p.y})`}
            fill={fillFor(active, "#2a2520")}
            fillOpacity={inFrame ? 1 : 0.35}
            stroke={sel ? "var(--color-fg)" : origin ? "var(--color-infect-soft)" : "var(--color-bg)"}
            strokeWidth={sel ? 2.2 : origin ? 1.6 : 0.7}
            className="pointer-events-none"
          />
        );
      })}
      {neRoads.map((h) => {
        const A = PLACE_BY_ID[h.a];
        const B = PLACE_BY_ID[h.b];
        if (!A || !B) return null;
        return (
          <path
            key={`rib-${h.a}-${h.b}`}
            d={ribbon(A.x, A.y, B.x, B.y, 3.4 + h.w * 3)}
            fill="var(--color-warn)"
            fillOpacity={0.55}
            className="pointer-events-none"
          />
        );
      })}
      {neAir.map((h) => {
        const A = PLACE_BY_ID[h.a];
        const B = PLACE_BY_ID[h.b];
        if (!A || !B) return null;
        const mx = (A.x + B.x) / 2;
        const my = (A.y + B.y) / 2 - Math.hypot(B.x - A.x, B.y - A.y) * 0.14;
        return (
          <path
            key={`air-${h.a}-${h.b}`}
            d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`}
            fill="none"
            stroke="var(--color-fg)"
            strokeOpacity={0.4}
            strokeWidth={0.7 + h.w * 0.6}
            strokeDasharray="3 2"
            className="pointer-events-none"
          />
        );
      })}
      {PLACES.map((p) => {
        const inFrame = NE.has(p.id);
        const active = placeActive(p.id);
        return (
          <g key={`lab-${p.id}`} className="pointer-events-none">
            <circle
              cx={p.x}
              cy={p.y}
              r={inFrame ? 2.6 : 1.4}
              fill={active > 0 ? "var(--color-infect-soft)" : "var(--color-fg)"}
            />
            {inFrame ? (
              <text
                x={p.x}
                y={p.y - p.ry - 5}
                textAnchor="middle"
                fill="var(--color-fg)"
                fontSize={8}
                fontFamily="IBM Plex Sans, sans-serif"
              >
                {p.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </MapStage>
  );
}
