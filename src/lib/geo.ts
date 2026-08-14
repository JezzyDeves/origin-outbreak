import geoStates from "@/data/geo-states.json";
import hospitalPack from "@/data/hospitals.json";
import airportPack from "@/data/airports.json";
import airRoutes from "@/data/air-routes.json";
import highwayPack from "@/data/highways.json";
import bedsByState from "@/data/beds-by-state.json";

export const MAP_W = geoStates.w;
export const MAP_H = geoStates.h;

export type StateShape = { id: string; name: string; d: string };
export type Hospital = {
  id: string;
  n: string;
  c: string;
  s: string;
  t: string;
  o: string;
  e: boolean;
  r: number | null;
  b: number;
  x: number;
  y: number;
};
export type Airport = {
  id: string;
  n: string;
  c: string;
  s: string;
  hub: string;
  pax: number;
  pax24: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
};
export type AirRoute = { a: string; b: string; w: number };
export type Highway = { n: string; t: string; pts: [number, number][] };

export const STATE_SHAPES = geoStates.states as StateShape[];
export const HOSPITALS = hospitalPack.hospitals as Hospital[];
export const MAJOR_HOSPITAL_IDS = new Set(hospitalPack.major as string[]);
export const HOSPITAL_SOURCE = hospitalPack.src;
export const AIRPORTS = airportPack.airports as Airport[];
export const AIRPORT_SOURCE = airportPack.src;
export const AIR_ROUTES = airRoutes as AirRoute[];
export const HIGHWAYS = highwayPack.highways as Highway[];
export const HIGHWAY_SOURCE = highwayPack.src;
export const BEDS_BY_STATE = bedsByState as Record<string, number>;
export const ROUTE_SOURCE =
  "OpenFlights scheduled U.S. routes, weighted by FAA CY2025 enplanements";

export const MAP_SOURCES = {
  cartography: "U.S. Census Bureau cartographic boundaries, Albers USA",
  hospitals: HOSPITAL_SOURCE,
  airports: AIRPORT_SOURCE,
  routes: ROUTE_SOURCE,
  highways: HIGHWAY_SOURCE,
};

export const AIRPORT_BY_ID: Record<string, Airport> = Object.fromEntries(
  AIRPORTS.map((a) => [a.id, a]),
);
export const HOSPITAL_BY_ID: Record<string, Hospital> = Object.fromEntries(
  HOSPITALS.map((h) => [h.id, h]),
);

const hospitalsByState = new Map<string, Hospital[]>();
for (const h of HOSPITALS) {
  const list = hospitalsByState.get(h.s) ?? [];
  list.push(h);
  hospitalsByState.set(h.s, list);
}
export function hospitalsInState(id: string): Hospital[] {
  return hospitalsByState.get(id) ?? [];
}

export const MAJOR_HOSPITALS = HOSPITALS.filter((h) => MAJOR_HOSPITAL_IDS.has(h.id));

export function formatPax(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

export function prettyName(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (ch) => ch.toUpperCase());
}

export function hospitalOccupancy(
  h: Hospital,
  stateHospitalized: number,
  stateBeds: number,
): { patients: number; capacity: number } {
  const capacity = Math.max(1, h.b);
  const patients = stateBeds > 0 ? (stateHospitalized * h.b) / stateBeds : 0;
  return { patients, capacity };
}
