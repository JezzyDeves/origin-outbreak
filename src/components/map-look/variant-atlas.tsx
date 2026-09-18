import { useCallback } from "react";
import { AIR_ROUTES, AIRPORT_BY_ID, HIGHWAYS, STATE_SHAPES } from "@/lib/geo";
import { heatColor, metricToT } from "@/lib/simulation";
import {
  AIRPORT_PLACE,
  ORIGIN_PLACE,
  PLACE_BY_ID,
  PLACES,
  hitPlace,
  placeActive,
  residualActive,
  type MapPick,
} from "@/lib/prototype-map-look";
import { MapStage } from "./map-stage";

export const VARIANT_ATLAS_NAME = "Atlas";

type Props = {
  pick: MapPick | null;
  onPick: (pick: MapPick | null) => void;
};

function fillFor(active: number, empty: string) {
  if (active <= 0) return empty;
  return heatColor(metricToT(active, "active"));
}

/** U.S. scale: Place polygons + Residual leftover fill + real highway polylines. Infection is fill only. */
export function VariantAtlas({ pick, onPick }: Props) {
  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(239,232,220,0.32)";
    ctx.lineWidth = 0.95;
    for (const hw of HIGHWAYS) {
      if (hw.pts.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(hw.pts[0][0], hw.pts[0][1]);
      for (let i = 1; i < hw.pts.length; i++) ctx.lineTo(hw.pts[i][0], hw.pts[i][1]);
      ctx.stroke();
    }
    for (const rt of AIR_ROUTES) {
      const A = AIRPORT_BY_ID[rt.a];
      const B = AIRPORT_BY_ID[rt.b];
      if (!A || !B) continue;
      if (!AIRPORT_PLACE[rt.a] || !AIRPORT_PLACE[rt.b]) continue;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2 - Math.hypot(B.x - A.x, B.y - A.y) * 0.16;
      ctx.quadraticCurveTo(mx, my, B.x, B.y);
      ctx.strokeStyle = "rgba(239,232,220,0.14)";
      ctx.lineWidth = 0.45 + rt.w * 1.4;
      ctx.stroke();
    }
  }, []);

  return (
    <MapStage
      className=""
      drawCanvas={drawCanvas}
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
            fill={fillFor(residualActive(sh.id), "var(--color-map-0)")}
            stroke={sel ? "var(--color-fg)" : "var(--color-bg)"}
            strokeWidth={sel ? 1.6 : 0.5}
            className="pointer-events-none"
          />
        );
      })}
      {PLACES.map((p) => {
        const sel = pick?.kind === "place" && pick.id === p.id;
        const origin = p.id === ORIGIN_PLACE;
        const active = placeActive(p.id);
        return (
          <ellipse
            key={p.id}
            cx={p.x}
            cy={p.y}
            rx={p.rx}
            ry={p.ry}
            transform={`rotate(${p.rot} ${p.x} ${p.y})`}
            fill={fillFor(active, "#2a2520")}
            stroke={sel ? "var(--color-fg)" : origin ? "var(--color-infect-soft)" : "var(--color-bg)"}
            strokeWidth={sel ? 2 : origin ? 1.4 : 0.7}
            className="pointer-events-none"
          />
        );
      })}
      {pick?.kind === "place"
        ? (() => {
            const p = PLACE_BY_ID[pick.id];
            if (!p) return null;
            return (
              <text
                x={p.x}
                y={p.y - p.ry - 4}
                textAnchor="middle"
                fill="var(--color-fg)"
                fontSize={9}
                fontFamily="IBM Plex Sans, sans-serif"
                className="pointer-events-none"
              >
                {p.name}
              </text>
            );
          })()
        : null}
    </MapStage>
  );
}
