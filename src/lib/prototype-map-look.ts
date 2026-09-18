/** PROTOTYPE — handful of Places for map-look. Not the catalog. Wipe with the branch. */

export type PlaceStub = {
  id: string;
  name: string;
  state: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot: number;
  pop: number;
};

export type RoadHop = { a: string; b: string; w: number };
export type AirHop = { a: string; b: string; w: number };

export type MapPick =
  | { kind: "place"; id: string }
  | { kind: "residual"; state: string };

export const ORIGIN_PLACE = "newyork";

/** Canned day-38 active counts. Origin is New York. */
export const PLACE_ACTIVE: Record<string, number> = {
  boston: 9000,
  providence: 3200,
  hartford: 2100,
  newyork: 42000,
  philadelphia: 18000,
  baltimore: 7200,
  washington: 5100,
  pittsburgh: 400,
  cleveland: 180,
  detroit: 40,
  chicago: 1400,
  atlanta: 260,
  miami: 90,
  dallas: 40,
  houston: 12,
  denver: 8,
  phoenix: 4,
  losangeles: 70,
  sanfrancisco: 15,
  seattle: 6,
  minneapolis: 20,
  anchorage: 0,
  honolulu: 0,
};

export const RESIDUAL_ACTIVE: Record<string, number> = {
  NY: 3600,
  NJ: 2900,
  PA: 1600,
  CT: 900,
  MA: 500,
  RI: 200,
  MD: 800,
  VA: 350,
  DC: 0,
  OH: 30,
  IL: 80,
  GA: 20,
};

export const PLACES: PlaceStub[] = [
  { id: "boston", name: "Boston", state: "MA", x: 834.8, y: 191.3, rx: 16, ry: 11, rot: -18, pop: 4_900_000 },
  { id: "providence", name: "Providence", state: "RI", x: 832.4, y: 204.3, rx: 7, ry: 5, rot: 10, pop: 1_670_000 },
  { id: "hartford", name: "Hartford", state: "CT", x: 814.5, y: 204.8, rx: 10, ry: 7, rot: -8, pop: 1_210_000 },
  { id: "newyork", name: "New York", state: "NY", x: 803, y: 231.5, rx: 30, ry: 18, rot: -12, pop: 19_900_000 },
  { id: "philadelphia", name: "Philadelphia", state: "PA", x: 788.6, y: 250.9, rx: 16, ry: 11, rot: 20, pop: 6_240_000 },
  { id: "baltimore", name: "Baltimore", state: "MD", x: 771.5, y: 268, rx: 10, ry: 7, rot: 8, pop: 2_840_000 },
  { id: "washington", name: "Washington", state: "DC", x: 767.5, y: 278, rx: 12, ry: 9, rot: -6, pop: 6_300_000 },
  { id: "pittsburgh", name: "Pittsburgh", state: "PA", x: 717.1, y: 252.9, rx: 10, ry: 8, rot: 0, pop: 2_370_000 },
  { id: "cleveland", name: "Cleveland", state: "OH", x: 692.1, y: 239.3, rx: 11, ry: 8, rot: -15, pop: 2_160_000 },
  { id: "detroit", name: "Detroit", state: "MI", x: 669.4, y: 227.3, rx: 12, ry: 9, rot: 12, pop: 4_360_000 },
  { id: "chicago", name: "Chicago", state: "IL", x: 607.6, y: 238.5, rx: 18, ry: 13, rot: -8, pop: 9_460_000 },
  { id: "atlanta", name: "Atlanta", state: "GA", x: 674.4, y: 389.6, rx: 16, ry: 12, rot: 10, pop: 6_090_000 },
  { id: "miami", name: "Miami", state: "FL", x: 761.7, y: 524.9, rx: 12, ry: 9, rot: 25, pop: 6_140_000 },
  { id: "dallas", name: "Dallas", state: "TX", x: 480, y: 414.3, rx: 16, ry: 12, rot: 0, pop: 7_640_000 },
  { id: "houston", name: "Houston", state: "TX", x: 506.8, y: 468.9, rx: 16, ry: 12, rot: 8, pop: 7_120_000 },
  { id: "denver", name: "Denver", state: "CO", x: 373.1, y: 277.5, rx: 12, ry: 9, rot: 0, pop: 2_960_000 },
  { id: "phoenix", name: "Phoenix", state: "AZ", x: 249.6, y: 383.4, rx: 16, ry: 12, rot: -10, pop: 4_950_000 },
  { id: "losangeles", name: "Los Angeles", state: "CA", x: 154.8, y: 354.3, rx: 22, ry: 14, rot: -20, pop: 13_200_000 },
  { id: "sanfrancisco", name: "San Francisco", state: "CA", x: 114.8, y: 272.1, rx: 14, ry: 10, rot: 30, pop: 4_620_000 },
  { id: "seattle", name: "Seattle", state: "WA", x: 166.1, y: 95, rx: 12, ry: 9, rot: 15, pop: 4_020_000 },
  { id: "minneapolis", name: "Minneapolis", state: "MN", x: 532.9, y: 188.3, rx: 12, ry: 9, rot: 0, pop: 3_690_000 },
  { id: "anchorage", name: "Anchorage", state: "AK", x: 178.4, y: 502.2, rx: 10, ry: 8, rot: 0, pop: 400_000 },
  { id: "honolulu", name: "Honolulu", state: "HI", x: 304.8, y: 505.8, rx: 8, ry: 6, rot: 0, pop: 1_000_000 },
];

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));

/** Next Place along a named Interstate in this toy set — intermediates omitted. */
export const ROAD_HOPS: RoadHop[] = [
  { a: "boston", b: "providence", w: 0.7 },
  { a: "providence", b: "hartford", w: 0.55 },
  { a: "hartford", b: "newyork", w: 0.9 },
  { a: "newyork", b: "philadelphia", w: 1 },
  { a: "philadelphia", b: "baltimore", w: 0.85 },
  { a: "baltimore", b: "washington", w: 0.8 },
  { a: "washington", b: "pittsburgh", w: 0.45 },
  { a: "pittsburgh", b: "cleveland", w: 0.5 },
  { a: "cleveland", b: "detroit", w: 0.55 },
  { a: "cleveland", b: "chicago", w: 0.7 },
  { a: "chicago", b: "minneapolis", w: 0.5 },
  { a: "washington", b: "atlanta", w: 0.6 },
  { a: "atlanta", b: "miami", w: 0.55 },
  { a: "chicago", b: "atlanta", w: 0.5 },
  { a: "dallas", b: "houston", w: 0.75 },
  { a: "chicago", b: "dallas", w: 0.45 },
  { a: "dallas", b: "denver", w: 0.35 },
  { a: "denver", b: "phoenix", w: 0.3 },
  { a: "phoenix", b: "losangeles", w: 0.55 },
  { a: "losangeles", b: "sanfrancisco", w: 0.7 },
  { a: "sanfrancisco", b: "seattle", w: 0.4 },
  { a: "denver", b: "seattle", w: 0.25 },
  { a: "chicago", b: "denver", w: 0.4 },
];

export const AIR_HOPS: AirHop[] = [
  { a: "newyork", b: "chicago", w: 1 },
  { a: "newyork", b: "atlanta", w: 0.85 },
  { a: "newyork", b: "miami", w: 0.8 },
  { a: "newyork", b: "dallas", w: 0.75 },
  { a: "newyork", b: "losangeles", w: 0.9 },
  { a: "newyork", b: "boston", w: 0.7 },
  { a: "newyork", b: "sanfrancisco", w: 0.65 },
  { a: "chicago", b: "losangeles", w: 0.7 },
  { a: "chicago", b: "denver", w: 0.55 },
  { a: "losangeles", b: "seattle", w: 0.5 },
  { a: "losangeles", b: "sanfrancisco", w: 0.6 },
  { a: "atlanta", b: "miami", w: 0.55 },
  { a: "atlanta", b: "dallas", w: 0.5 },
  { a: "seattle", b: "anchorage", w: 0.35 },
  { a: "losangeles", b: "honolulu", w: 0.4 },
  { a: "dallas", b: "houston", w: 0.45 },
  { a: "washington", b: "atlanta", w: 0.5 },
];

/** FAA id → Place in this handful. */
export const AIRPORT_PLACE: Record<string, string> = {
  ATL: "atlanta",
  DFW: "dallas",
  DAL: "dallas",
  ORD: "chicago",
  MDW: "chicago",
  DEN: "denver",
  LAX: "losangeles",
  BUR: "losangeles",
  SNA: "losangeles",
  ONT: "losangeles",
  JFK: "newyork",
  LGA: "newyork",
  EWR: "newyork",
  MIA: "miami",
  FLL: "miami",
  SFO: "sanfrancisco",
  OAK: "sanfrancisco",
  SJC: "sanfrancisco",
  SEA: "seattle",
  PHX: "phoenix",
  IAH: "houston",
  HOU: "houston",
  BOS: "boston",
  MSP: "minneapolis",
  DTW: "detroit",
  PHL: "philadelphia",
  IAD: "washington",
  DCA: "washington",
  BWI: "baltimore",
  HNL: "honolulu",
  ANC: "anchorage",
  PIT: "pittsburgh",
  CLE: "cleveland",
  PVD: "providence",
  BDL: "hartford",
};

export const NE_FOCUS = { x: 798, y: 232, k: 3.4 };

export function placeActive(id: string): number {
  return PLACE_ACTIVE[id] ?? 0;
}

export function residualActive(state: string): number {
  return RESIDUAL_ACTIVE[state] ?? 0;
}

export function inEllipse(mx: number, my: number, p: PlaceStub): boolean {
  const dx = mx - p.x;
  const dy = my - p.y;
  const rad = (p.rot * Math.PI) / 180;
  const c = Math.cos(-rad);
  const s = Math.sin(-rad);
  const x = dx * c - dy * s;
  const y = dx * s + dy * c;
  return (x * x) / (p.rx * p.rx) + (y * y) / (p.ry * p.ry) <= 1;
}

export function hitPlace(mx: number, my: number): PlaceStub | null {
  let best: PlaceStub | null = null;
  let bestD = Infinity;
  for (const p of PLACES) {
    if (!inEllipse(mx, my, p)) continue;
    const d = Math.hypot(mx - p.x, my - p.y);
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

export function hitPlaceDot(mx: number, my: number, scale: number): PlaceStub | null {
  const thresh = 14 / Math.max(0.4, scale);
  let best: PlaceStub | null = null;
  let bestD = thresh;
  for (const p of PLACES) {
    const r = 3.2 + Math.sqrt(p.pop) / 900;
    const d = Math.hypot(mx - p.x, my - p.y);
    if (d < bestD + r) {
      best = p;
      bestD = d - r;
    }
  }
  return best;
}

export function placesHit(): number {
  return PLACES.filter((p) => placeActive(p.id) > 0).length;
}

export function residualsHit(): number {
  return Object.values(RESIDUAL_ACTIVE).filter((n) => n > 0).length;
}

export function pickLabel(pick: MapPick | null): string {
  if (!pick) return "none";
  if (pick.kind === "place") {
    const p = PLACE_BY_ID[pick.id];
    return p ? `Place · ${p.name}` : pick.id;
  }
  return `Residual · ${pick.state}`;
}

export function pickActive(pick: MapPick | null): number {
  if (!pick) return 0;
  if (pick.kind === "place") return placeActive(pick.id);
  return residualActive(pick.state);
}
