import bedsByState from "@/data/beds-by-state.json";
import airportPack from "@/data/airports.json";

export type Region = "northeast" | "midwest" | "south" | "west";

export type StateInfo = {
  id: string;
  name: string;
  pop: number;
  lat: number;
  lng: number;
  density: number;
  elderly: number;
  beds: number;
  air: number;
  region: Region;
  neighbors: string[];
};

export const STATES: StateInfo[] = [
  { id: "AL", name: "Alabama", pop: 5108468, lat: 32.8, lng: -86.8, density: 99, elderly: 0.177, beds: 15300, air: 0.22, region: "south", neighbors: ["MS", "TN", "GA", "FL"] },
  { id: "AK", name: "Alaska", pop: 733406, lat: 64.2, lng: -153.5, density: 1.3, elderly: 0.136, beds: 1600, air: 0.28, region: "west", neighbors: [] },
  { id: "AZ", name: "Arizona", pop: 7431344, lat: 34.3, lng: -111.7, density: 65, elderly: 0.186, beds: 15600, air: 0.65, region: "west", neighbors: ["CA", "NV", "UT", "CO", "NM"] },
  { id: "AR", name: "Arkansas", pop: 3067732, lat: 34.9, lng: -92.4, density: 58, elderly: 0.177, beds: 8900, air: 0.12, region: "south", neighbors: ["MO", "TN", "MS", "LA", "TX", "OK"] },
  { id: "CA", name: "California", pop: 38965193, lat: 37.2, lng: -119.5, density: 251, elderly: 0.155, beds: 73800, air: 0.95, region: "west", neighbors: ["OR", "NV", "AZ"] },
  { id: "CO", name: "Colorado", pop: 5877610, lat: 39.0, lng: -105.5, density: 56, elderly: 0.154, beds: 11200, air: 0.9, region: "west", neighbors: ["WY", "NE", "KS", "OK", "NM", "AZ", "UT"] },
  { id: "CT", name: "Connecticut", pop: 3617176, lat: 41.6, lng: -72.7, density: 746, elderly: 0.183, beds: 7800, air: 0.18, region: "northeast", neighbors: ["NY", "MA", "RI"] },
  { id: "DE", name: "Delaware", pop: 1031890, lat: 39.0, lng: -75.5, density: 508, elderly: 0.199, beds: 2300, air: 0.08, region: "south", neighbors: ["MD", "PA", "NJ"] },
  { id: "DC", name: "District of Columbia", pop: 678972, lat: 38.91, lng: -77.04, density: 11280, elderly: 0.129, beds: 3200, air: 0.42, region: "south", neighbors: ["MD", "VA"] },
  { id: "FL", name: "Florida", pop: 22610726, lat: 28.1, lng: -81.7, density: 401, elderly: 0.213, beds: 58000, air: 0.88, region: "south", neighbors: ["AL", "GA"] },
  { id: "GA", name: "Georgia", pop: 11029227, lat: 32.7, lng: -83.4, density: 186, elderly: 0.148, beds: 24800, air: 1.0, region: "south", neighbors: ["FL", "AL", "TN", "NC", "SC"] },
  { id: "HI", name: "Hawaii", pop: 1435138, lat: 20.8, lng: -156.3, density: 223, elderly: 0.198, beds: 3100, air: 0.48, region: "west", neighbors: [] },
  { id: "ID", name: "Idaho", pop: 1964726, lat: 44.4, lng: -114.6, density: 23, elderly: 0.166, beds: 3400, air: 0.16, region: "west", neighbors: ["WA", "OR", "NV", "UT", "WY", "MT"] },
  { id: "IL", name: "Illinois", pop: 12549689, lat: 40.0, lng: -89.2, density: 228, elderly: 0.167, beds: 31200, air: 0.92, region: "midwest", neighbors: ["WI", "IA", "MO", "KY", "IN"] },
  { id: "IN", name: "Indiana", pop: 6862199, lat: 39.9, lng: -86.3, density: 189, elderly: 0.165, beds: 17800, air: 0.28, region: "midwest", neighbors: ["MI", "OH", "KY", "IL"] },
  { id: "IA", name: "Iowa", pop: 3207004, lat: 42.1, lng: -93.5, density: 57, elderly: 0.181, beds: 9200, air: 0.14, region: "midwest", neighbors: ["MN", "WI", "IL", "MO", "NE", "SD"] },
  { id: "KS", name: "Kansas", pop: 2940546, lat: 38.5, lng: -98.3, density: 36, elderly: 0.167, beds: 8800, air: 0.18, region: "midwest", neighbors: ["NE", "MO", "OK", "CO"] },
  { id: "KY", name: "Kentucky", pop: 4526154, lat: 37.5, lng: -85.3, density: 114, elderly: 0.173, beds: 13200, air: 0.22, region: "south", neighbors: ["IL", "IN", "OH", "WV", "VA", "TN", "MO"] },
  { id: "LA", name: "Louisiana", pop: 4573749, lat: 31.1, lng: -92.0, density: 108, elderly: 0.166, beds: 14800, air: 0.32, region: "south", neighbors: ["TX", "AR", "MS"] },
  { id: "ME", name: "Maine", pop: 1395722, lat: 45.3, lng: -69.2, density: 44, elderly: 0.221, beds: 3200, air: 0.1, region: "northeast", neighbors: ["NH"] },
  { id: "MD", name: "Maryland", pop: 6180253, lat: 39.1, lng: -76.8, density: 636, elderly: 0.164, beds: 11800, air: 0.48, region: "south", neighbors: ["PA", "DE", "VA", "WV", "DC"] },
  { id: "MA", name: "Massachusetts", pop: 7001399, lat: 42.3, lng: -71.8, density: 894, elderly: 0.177, beds: 15600, air: 0.58, region: "northeast", neighbors: ["NY", "VT", "NH", "RI", "CT"] },
  { id: "MI", name: "Michigan", pop: 10037261, lat: 44.3, lng: -85.4, density: 178, elderly: 0.184, beds: 24800, air: 0.52, region: "midwest", neighbors: ["OH", "IN", "WI"] },
  { id: "MN", name: "Minnesota", pop: 5737915, lat: 46.3, lng: -94.3, density: 71, elderly: 0.169, beds: 13400, air: 0.55, region: "midwest", neighbors: ["WI", "IA", "SD", "ND"] },
  { id: "MS", name: "Mississippi", pop: 2939690, lat: 32.7, lng: -89.7, density: 63, elderly: 0.171, beds: 9800, air: 0.1, region: "south", neighbors: ["LA", "AR", "TN", "AL"] },
  { id: "MO", name: "Missouri", pop: 6196156, lat: 38.4, lng: -92.5, density: 90, elderly: 0.177, beds: 17800, air: 0.38, region: "midwest", neighbors: ["IA", "IL", "KY", "TN", "AR", "OK", "KS", "NE"] },
  { id: "MT", name: "Montana", pop: 1132812, lat: 47.1, lng: -109.6, density: 7.5, elderly: 0.199, beds: 3600, air: 0.12, region: "west", neighbors: ["ID", "WY", "SD", "ND"] },
  { id: "NE", name: "Nebraska", pop: 1978379, lat: 41.5, lng: -99.8, density: 26, elderly: 0.167, beds: 6400, air: 0.22, region: "midwest", neighbors: ["SD", "IA", "MO", "KS", "CO", "WY"] },
  { id: "NV", name: "Nevada", pop: 3194176, lat: 39.3, lng: -116.7, density: 29, elderly: 0.166, beds: 6200, air: 0.68, region: "west", neighbors: ["OR", "ID", "UT", "AZ", "CA"] },
  { id: "NH", name: "New Hampshire", pop: 1402054, lat: 43.7, lng: -71.6, density: 154, elderly: 0.199, beds: 2800, air: 0.08, region: "northeast", neighbors: ["VT", "ME", "MA"] },
  { id: "NJ", name: "New Jersey", pop: 9290841, lat: 40.2, lng: -74.7, density: 1263, elderly: 0.171, beds: 19800, air: 0.62, region: "northeast", neighbors: ["NY", "PA", "DE"] },
  { id: "NM", name: "New Mexico", pop: 2114371, lat: 34.4, lng: -106.1, density: 17, elderly: 0.188, beds: 4200, air: 0.18, region: "west", neighbors: ["AZ", "UT", "CO", "OK", "TX"] },
  { id: "NY", name: "New York", pop: 19571216, lat: 42.9, lng: -75.5, density: 429, elderly: 0.177, beds: 51200, air: 0.9, region: "northeast", neighbors: ["PA", "NJ", "CT", "MA", "VT"] },
  { id: "NC", name: "North Carolina", pop: 10835491, lat: 35.6, lng: -79.4, density: 215, elderly: 0.171, beds: 23200, air: 0.72, region: "south", neighbors: ["VA", "TN", "GA", "SC"] },
  { id: "ND", name: "North Dakota", pop: 783926, lat: 47.5, lng: -100.5, density: 11, elderly: 0.162, beds: 3100, air: 0.1, region: "midwest", neighbors: ["MT", "SD", "MN"] },
  { id: "OH", name: "Ohio", pop: 11785930, lat: 40.3, lng: -82.8, density: 288, elderly: 0.181, beds: 31200, air: 0.42, region: "midwest", neighbors: ["MI", "PA", "WV", "KY", "IN"] },
  { id: "OK", name: "Oklahoma", pop: 4053824, lat: 35.6, lng: -97.5, density: 58, elderly: 0.164, beds: 10800, air: 0.22, region: "south", neighbors: ["KS", "MO", "AR", "TX", "NM", "CO"] },
  { id: "OR", name: "Oregon", pop: 4233358, lat: 43.9, lng: -120.6, density: 44, elderly: 0.187, beds: 7200, air: 0.38, region: "west", neighbors: ["WA", "ID", "NV", "CA"] },
  { id: "PA", name: "Pennsylvania", pop: 12961683, lat: 40.9, lng: -77.8, density: 290, elderly: 0.194, beds: 34800, air: 0.52, region: "northeast", neighbors: ["NY", "NJ", "DE", "MD", "WV", "OH"] },
  { id: "RI", name: "Rhode Island", pop: 1095962, lat: 41.7, lng: -71.6, density: 1060, elderly: 0.183, beds: 2400, air: 0.1, region: "northeast", neighbors: ["CT", "MA"] },
  { id: "SC", name: "South Carolina", pop: 5373555, lat: 33.9, lng: -80.9, density: 170, elderly: 0.186, beds: 11800, air: 0.18, region: "south", neighbors: ["NC", "GA"] },
  { id: "SD", name: "South Dakota", pop: 919318, lat: 44.4, lng: -100.2, density: 12, elderly: 0.176, beds: 3600, air: 0.08, region: "midwest", neighbors: ["ND", "MN", "IA", "NE", "WY", "MT"] },
  { id: "TN", name: "Tennessee", pop: 7126489, lat: 35.8, lng: -86.3, density: 168, elderly: 0.171, beds: 19200, air: 0.38, region: "south", neighbors: ["KY", "VA", "NC", "GA", "AL", "MS", "AR", "MO"] },
  { id: "TX", name: "Texas", pop: 30503301, lat: 31.5, lng: -99.3, density: 114, elderly: 0.132, beds: 67800, air: 0.98, region: "south", neighbors: ["NM", "OK", "AR", "LA"] },
  { id: "UT", name: "Utah", pop: 3417734, lat: 39.3, lng: -111.7, density: 40, elderly: 0.117, beds: 5800, air: 0.48, region: "west", neighbors: ["ID", "WY", "CO", "NM", "AZ", "NV"] },
  { id: "VT", name: "Vermont", pop: 647464, lat: 44.1, lng: -72.7, density: 70, elderly: 0.211, beds: 1400, air: 0.05, region: "northeast", neighbors: ["NY", "NH", "MA"] },
  { id: "VA", name: "Virginia", pop: 8715698, lat: 37.5, lng: -78.6, density: 218, elderly: 0.165, beds: 17800, air: 0.42, region: "south", neighbors: ["MD", "DC", "NC", "TN", "KY", "WV"] },
  { id: "WA", name: "Washington", pop: 7812880, lat: 47.4, lng: -120.5, density: 116, elderly: 0.162, beds: 13200, air: 0.68, region: "west", neighbors: ["OR", "ID"] },
  { id: "WV", name: "West Virginia", pop: 1770071, lat: 38.6, lng: -80.6, density: 74, elderly: 0.207, beds: 6200, air: 0.06, region: "south", neighbors: ["OH", "PA", "MD", "VA", "KY"] },
  { id: "WI", name: "Wisconsin", pop: 5910955, lat: 44.6, lng: -89.8, density: 108, elderly: 0.181, beds: 13400, air: 0.28, region: "midwest", neighbors: ["MN", "IA", "IL", "MI"] },
  { id: "WY", name: "Wyoming", pop: 584057, lat: 43.0, lng: -107.6, density: 6, elderly: 0.181, beds: 1800, air: 0.06, region: "west", neighbors: ["MT", "SD", "NE", "CO", "UT", "ID"] },
];

applyOfficialCapacity(STATES);

export const STATE_BY_ID: Record<string, StateInfo> = Object.fromEntries(
  STATES.map((s) => [s.id, s]),
);

export const TOTAL_POP = STATES.reduce((sum, s) => sum + s.pop, 0);

function applyOfficialCapacity(list: StateInfo[]) {
  const beds = bedsByState as Record<string, number>;
  const pax: Record<string, number> = {};
  const hub: Record<string, number> = {};
  for (const a of airportPack.airports as { s: string; pax: number }[]) {
    pax[a.s] = (pax[a.s] || 0) + a.pax;
    hub[a.s] = Math.max(hub[a.s] || 0, a.pax);
  }
  const maxPax = Math.max(1, ...Object.values(pax));
  const maxHub = Math.max(1, ...Object.values(hub));
  for (const s of list) {
    if (beds[s.id]) s.beds = beds[s.id];
    if (pax[s.id]) {
      s.air = Math.round(Math.max(pax[s.id] / maxPax, hub[s.id] / maxHub) * 100) / 100;
    } else {
      s.air = Math.min(s.air, 0.12);
    }
  }
}

export function haversineMiles(a: StateInfo, b: StateInfo): number {
  const r = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

const neighborSet = new Map<string, Set<string>>();
for (const s of STATES) {
  neighborSet.set(s.id, new Set(s.neighbors));
}

export function isAdjacent(a: string, b: string): boolean {
  return neighborSet.get(a)?.has(b) ?? false;
}

export function formatPop(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  return Math.round(n).toLocaleString("en-US");
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 10_000) return `${(n / 1000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return Math.round(n).toLocaleString("en-US");
}
