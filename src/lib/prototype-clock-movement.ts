/** PROTOTYPE — canned Clock + Movement for appearance. Wipe with the branch. */

import { AIR_HOPS, PLACE_BY_ID, ROAD_HOPS } from "@/lib/prototype-map-look";

export const SIM_STEP_SECONDS = 86_400;
export const CAP_DAY = 730;
export const START_DAY = 38;

export type ClockRateId = "realtime" | "hour" | "threeHour" | "day";

export const CLOCK_RATES: {
  id: ClockRateId;
  label: string;
  short: string;
  /** Simulated seconds advanced per wall-clock second. */
  simPerWall: number;
}[] = [
  { id: "realtime", label: "Realtime", short: "1:1", simPerWall: 1 },
  { id: "hour", label: "1 hour / sec", short: "1 h/s", simPerWall: 3_600 },
  { id: "threeHour", label: "3 hours / sec", short: "3 h/s", simPerWall: 10_800 },
  { id: "day", label: "1 day / sec", short: "1 d/s", simPerWall: 86_400 },
];

export function rateSpec(id: ClockRateId) {
  return CLOCK_RATES.find((r) => r.id === id) ?? CLOCK_RATES[1];
}

/** Wall seconds one Sim step takes at this Clock rate. */
export function wallSecondsPerStep(id: ClockRateId) {
  return SIM_STEP_SECONDS / rateSpec(id).simPerWall;
}

export type DrawnHop = {
  kind: "road" | "air";
  a: string;
  b: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cx: number;
  cy: number;
  /** Road: symmetric trips both ways. Air: unused. */
  trips: number;
  paxAB: number;
  paxBA: number;
};

function airControl(ax: number, ay: number, bx: number, by: number) {
  const d = Math.hypot(bx - ax, by - ay);
  return { cx: (ax + bx) / 2, cy: (ay + by) / 2 - d * 0.18 };
}

export function airPath(ax: number, ay: number, bx: number, by: number) {
  const { cx, cy } = airControl(ax, ay, bx, by);
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}

export function alongLine(ax: number, ay: number, bx: number, by: number, t: number) {
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t };
}

export function alongQuad(
  ax: number,
  ay: number,
  cx: number,
  cy: number,
  bx: number,
  by: number,
  t: number,
) {
  const u = 1 - t;
  return {
    x: u * u * ax + 2 * u * t * cx + t * t * bx,
    y: u * u * ay + 2 * u * t * cy + t * t * by,
  };
}

function distToSeg(mx: number, my: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((mx - ax) * dx + (my - ay) * dy) / len2));
  return Math.hypot(mx - (ax + dx * t), my - (ay + dy * t));
}

export const DRAWN_HOPS: DrawnHop[] = [
  ...ROAD_HOPS.flatMap((h) => {
    const A = PLACE_BY_ID[h.a];
    const B = PLACE_BY_ID[h.b];
    if (!A || !B) return [];
    const { cx, cy } = airControl(A.x, A.y, B.x, B.y);
    return [
      {
        kind: "road" as const,
        a: h.a,
        b: h.b,
        ax: A.x,
        ay: A.y,
        bx: B.x,
        by: B.y,
        cx,
        cy,
        trips: Math.round(h.w * 22_000),
        paxAB: 0,
        paxBA: 0,
      },
    ];
  }),
  ...AIR_HOPS.flatMap((h) => {
    const A = PLACE_BY_ID[h.a];
    const B = PLACE_BY_ID[h.b];
    if (!A || !B) return [];
    const { cx, cy } = airControl(A.x, A.y, B.x, B.y);
    const paxAB = Math.round(h.w * 9_500);
    return [
      {
        kind: "air" as const,
        a: h.a,
        b: h.b,
        ax: A.x,
        ay: A.y,
        bx: B.x,
        by: B.y,
        cx,
        cy,
        trips: 0,
        paxAB,
        paxBA: Math.round(paxAB * 0.82),
      },
    ];
  }),
];

export function hopVolume(h: DrawnHop) {
  return h.kind === "road" ? h.trips : h.paxAB + h.paxBA;
}

export function particleCount(volume: number) {
  return Math.max(1, Math.min(8, Math.round(Math.log2(Math.max(volume, 400) / 400))));
}

export function hopsForPlace(id: string) {
  return DRAWN_HOPS.filter((h) => h.a === id || h.b === id);
}

export function hitCorridor(mx: number, my: number, scale: number): DrawnHop | null {
  const thresh = 10 / Math.max(0.4, scale);
  let best: DrawnHop | null = null;
  let bestD = thresh;
  for (const h of DRAWN_HOPS) {
    let d: number;
    if (h.kind === "road") {
      d = distToSeg(mx, my, h.ax, h.ay, h.bx, h.by);
    } else {
      d = Infinity;
      for (let i = 0; i <= 12; i++) {
        const p = alongQuad(h.ax, h.ay, h.cx, h.cy, h.bx, h.by, i / 12);
        d = Math.min(d, Math.hypot(mx - p.x, my - p.y));
      }
    }
    if (d < bestD) {
      best = h;
      bestD = d;
    }
  }
  return best;
}

export function hopLabel(h: DrawnHop) {
  const A = PLACE_BY_ID[h.a]?.name ?? h.a;
  const B = PLACE_BY_ID[h.b]?.name ?? h.b;
  return h.kind === "road" ? `${A} — ${B}` : `${A} → ${B}`;
}
