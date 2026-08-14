import { AIR_ROUTES, AIRPORT_BY_ID } from "./geo";

const pairRaw: Record<string, number> = {};
let pairMax = 0;

for (const rt of AIR_ROUTES) {
  const A = AIRPORT_BY_ID[rt.a];
  const B = AIRPORT_BY_ID[rt.b];
  if (!A || !B || A.s === B.s) continue;
  const key = A.s < B.s ? `${A.s}|${B.s}` : `${B.s}|${A.s}`;
  const add = rt.w * Math.sqrt((A.pax / 1e6) * (B.pax / 1e6));
  pairRaw[key] = (pairRaw[key] || 0) + add;
  if (pairRaw[key] > pairMax) pairMax = pairRaw[key];
}

/** 0–1 boost for a state pair that sits on real scheduled air corridors. */
export function airCorridorBoost(a: string, b: string): number {
  if (a === b || pairMax <= 0) return 0;
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  return (pairRaw[key] || 0) / pairMax;
}
