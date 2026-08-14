import {
  STATES,
  STATE_BY_ID,
  TOTAL_POP,
  haversineMiles,
  isAdjacent,
  type StateInfo,
} from "./states";
import { airCorridorBoost } from "./traffic";

import {
  NPI_META,
  hashSeed,
  type Disease,
  type NpiLevel,
  type SeedConfig,
  type TransmissionMode,
} from "./disease";

export type StateSim = {
  id: string;
  S: number;
  E: number;
  I: number;
  R: number;
  D: number;
  H: number;
  N: number;
  newCases: number;
  newDeaths: number;
  cumulative: number;
  firstDay: number | null;
};

export type NationalSnap = {
  day: number;
  month: number;
  infected: number;
  exposed: number;
  infectious: number;
  recovered: number;
  deaths: number;
  hospitalized: number;
  newCases: number;
  newDeaths: number;
  cumulative: number;
  susceptible: number;
  reff: number;
  statesHit: number;
  overflowStates: number;
};

export type HistoryPoint = {
  day: number;
  infected: number;
  deaths: number;
  hospitalized: number;
  newCases: number;
  reff: number;
};

export type SimEvent = {
  day: number;
  kind: "seed" | "arrive" | "death" | "overflow" | "wave" | "peak" | "vax";
  text: string;
};

export type MapMetric = "active" | "attack" | "deaths";

const IDS = STATES.map((s) => s.id);

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(lambda: number, rng: () => number): number {
  if (lambda <= 0) return 0;
  if (lambda > 30) {
    const z = Math.sqrt(-2 * Math.log(Math.max(1e-12, rng()))) * Math.cos(2 * Math.PI * rng());
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
  }
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > L && k < 80);
  return k - 1;
}

function modeWeight(modes: Record<TransmissionMode, number>): number {
  return (
    modes.droplet +
    modes.aerosol +
    modes.contact +
    modes.fecal +
    modes.vector +
    1e-6
  );
}

function airCoupling(a: StateInfo, b: StateInfo, modes: Record<TransmissionMode, number>): number {
  const w = modeWeight(modes);
  const airShare = (modes.droplet + modes.aerosol) / w;
  const contactShare = (modes.contact + modes.fecal) / w;
  const vectorShare = modes.vector / w;
  const island = a.neighbors.length === 0 || b.neighbors.length === 0;
  if (island) return 0.15 + 10 * a.air * b.air * (0.35 + airShare);
  return 1 + 9 * a.air * b.air * (0.4 + 0.6 * airShare) * (1 - 0.65 * contactShare) * (1 - 0.8 * vectorShare);
}

function groundBoost(a: string, b: string, modes: Record<TransmissionMode, number>): number {
  if (!isAdjacent(a, b)) return 1;
  const w = modeWeight(modes);
  const local = (modes.contact + modes.fecal + modes.droplet * 0.5) / w;
  return 3.4 + 2.2 * local;
}

type Flow = { to: number; weight: number };

export class Epidemic {
  disease: Disease;
  seed: SeedConfig;
  npi: NpiLevel;
  mobility: number;
  day = 0;
  states: StateSim[];
  history: HistoryPoint[] = [];
  events: SimEvent[] = [];
  lastReff = 0;
  peakInfectious = 0;
  peakDay = 0;
  vaxOn = false;
  private rng: () => number;
  private flows: Flow[][];
  private lastOverflow = new Set<string>();
  private announcedDeath = false;
  private announcedVax = false;

  constructor(disease: Disease, seed: SeedConfig) {
    this.disease = { ...disease, modes: { ...disease.modes } };
    this.seed = { ...seed, extraOrigins: [...seed.extraOrigins] };
    this.npi = seed.npi;
    this.mobility = seed.mobility;
    this.vaxOn = disease.vaxAvailable;
    const h = hashSeed(
      `${disease.name}|${seed.origin}|${seed.initialCases}|${seed.startMonth}|${seed.rngSalt}`,
    );
    this.rng = mulberry32(h);
    this.states = STATES.map((s) => {
      const immune = Math.min(0.97, Math.max(0, disease.priorImmunity));
      const R = s.pop * immune;
      return {
        id: s.id,
        S: s.pop - R,
        E: 0,
        I: 0,
        R,
        D: 0,
        H: 0,
        N: s.pop,
        newCases: 0,
        newDeaths: 0,
        cumulative: 0,
        firstDay: null,
      };
    });
    this.flows = this.buildFlows();
    this.plantSeeds();
    this.record();
  }

  private buildFlows(): Flow[][] {
    const n = STATES.length;
    const raw: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = STATES[i];
        const b = STATES[j];
        const dist = Math.max(90, haversineMiles(a, b));
        let w = (a.pop * b.pop) / dist ** 2;
        w *= airCoupling(a, b, this.disease.modes);
        w *= groundBoost(a.id, b.id, this.disease.modes);
        const corridor = airCorridorBoost(a.id, b.id);
        if (corridor > 0) w *= 1 + 4.2 * corridor;
        raw[i][j] = w;
        raw[j][i] = w;
      }
    }
    const flows: Flow[][] = Array.from({ length: n }, () => []);
    const dailyLeave = 0.0038;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) sum += raw[i][j];
      if (sum <= 0) continue;
      const budget = STATES[i].pop * dailyLeave;
      for (let j = 0; j < n; j++) {
        if (raw[i][j] <= 0) continue;
        flows[i].push({ to: j, weight: (raw[i][j] / sum) * budget });
      }
    }
    return flows;
  }

  private plantSeeds() {
    const origins = new Set<string>([this.seed.origin, ...this.seed.extraOrigins]);
    if (this.seed.intro === "airport") {
      const ranked = [...STATES].sort((a, b) => b.air - a.air).slice(0, 6);
      for (const s of ranked) origins.add(s.id);
    }
    if (this.seed.intro === "multi") {
      for (const id of ["CA", "TX", "NY", "FL", this.seed.origin]) origins.add(id);
    }
    const list = [...origins];
    const share = this.seed.initialCases / list.length;
    for (const id of list) {
      const idx = IDS.indexOf(id);
      if (idx < 0) continue;
      const extra = id === this.seed.origin ? Math.ceil(share * 0.6) : 0;
      const n = Math.max(1, Math.round(share + extra));
      this.infect(idx, n);
    }
    const originName = STATE_BY_ID[this.seed.origin]?.name ?? this.seed.origin;
    this.events.push({
      day: 0,
      kind: "seed",
      text: `${this.seed.initialCases} index cases placed in ${originName}${list.length > 1 ? ` and ${list.length - 1} other sites` : ""}.`,
    });
  }

  private infect(idx: number, n: number) {
    const st = this.states[idx];
    const take = Math.min(st.S, n);
    if (take <= 0) return;
    st.S -= take;
    st.E += take * 0.65;
    st.I += take * 0.35;
    st.cumulative += take;
    st.newCases += take;
    if (st.firstDay === null) st.firstDay = this.day;
  }

  calendarMonth(): number {
    return (this.seed.startMonth + Math.floor(this.day / 30.44)) % 12;
  }

  private seasonFactor(): number {
    const amp = this.disease.seasonality;
    if (amp <= 0.01) return 1;
    const peak = this.disease.peakMonth;
    const month = this.seed.startMonth + this.day / 30.44;
    const phase = ((month - peak) / 12) * Math.PI * 2;
    return 1 + amp * Math.cos(phase);
  }

  private localBeta(info: StateInfo): number {
    const d = this.disease;
    const gamma = 1 / Math.max(0.75, d.infectiousDays);
    const w = modeWeight(d.modes);
    const aerosol = d.modes.aerosol / w;
    const droplet = d.modes.droplet / w;
    const contact = d.modes.contact / w;
    const fecal = d.modes.fecal / w;
    const vector = d.modes.vector / w;

    const dens = Math.max(6, info.density);
    const densBoost = 1 + aerosol * 0.22 * Math.log10(dens / 80) + droplet * 0.08 * Math.log10(dens / 120);

    const season = this.seasonFactor();
    const indoor = 1 + (droplet + aerosol * 0.6) * (season - 1) * 0.45;

    const month = this.calendarMonth();
    const summer = 0.5 + 0.5 * Math.cos(((month - 6) / 12) * Math.PI * 2);
    const latWarm = Math.max(0, 1 - Math.abs(info.lat - 29) / 22);
    const vectorClimate = vector <= 0 ? 1 : 1 - vector + vector * (0.08 + 1.7 * latWarm * Math.max(0.05, summer));

    const surface = 1 + contact * Math.min(0.35, d.surfaceHours / 80);
    const fecalClimate = 1 + fecal * (info.region === "south" ? 0.12 : -0.04);

    const npi = NPI_META[this.npi].beta;
    return d.r0 * gamma * densBoost * indoor * vectorClimate * surface * fecalClimate * npi;
  }

  private infectiousPressure(st: StateSim): number {
    const d = this.disease;
    const preFrac = Math.min(0.85, d.preSymDays / Math.max(0.8, d.incubationDays));
    const eInf = st.E * preFrac * d.preSymInfect;
    const iInf =
      st.I * ((1 - d.asymptomaticFrac) + d.asymptomaticFrac * d.asymptomaticInfect);
    return eInf + iInf;
  }

  step() {
    this.day += 1;
    const d = this.disease;
    const sigma = 1 / Math.max(0.8, d.incubationDays);
    const gamma = 1 / Math.max(0.75, d.infectiousDays);
    const wane = 1 / Math.max(45, d.immunityDays);
    const npiMob = NPI_META[this.npi].mobility;
    const travelScale = this.mobility * npiMob;
    const n = this.states.length;

    const pressure = this.states.map((st) => this.infectiousPressure(st));
    const importI = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      const src = this.states[i];
      if (pressure[i] <= 0.15) continue;
      const frac = pressure[i] / src.N;
      for (const f of this.flows[i]) {
        importI[f.to] += f.weight * travelScale * frac;
      }
    }

    let nationalNew = 0;
    let nationalDeaths = 0;
    let infectiousSum = 0;
    let reffNum = 0;
    let reffDen = 0;

    for (let i = 0; i < n; i++) {
      const st = this.states[i];
      const info = STATES[i];
      const beta = this.localBeta(info);
      const ageIfr =
        d.ifr * (1 + d.ageBias * ((info.elderly - 0.17) / 0.08));
      const overflow = st.H > info.beds ? 1 + 0.85 * ((st.H - info.beds) / info.beds) : 1;
      const ifr = Math.min(0.55, Math.max(0.00001, ageIfr * overflow));

      const localFoi = (beta * pressure[i]) / st.N;
      const visitFoi = (beta * importI[i] * 5.5) / st.N;
      const foi = localFoi + visitFoi;

      let newE: number;
      if (st.cumulative < 8 && foi * st.S < 4) {
        const k = Math.max(0.08, d.overdispersion);
        const lam = Math.max(0, foi * st.S * k);
        newE = Math.min(st.S, poisson(lam, this.rng));
      } else {
        newE = st.S * (1 - Math.exp(-foi));
      }

      const onset = st.E * sigma;
      const leavingI = st.I * gamma;
      const deaths = leavingI * ifr;
      const recover = leavingI - deaths;
      const waned = st.R * wane;

      let vax = 0;
      if (this.vaxOn && d.vaxAvailable) {
        vax = Math.min(st.S - newE, st.S * d.vaxDaily) * d.vaxEfficacy;
      }

      st.S = Math.max(0, st.S - newE - vax + waned);
      st.E = Math.max(0, st.E + newE - onset);
      st.I = Math.max(0, st.I + onset - leavingI);
      st.R = Math.max(0, st.R + recover + vax - waned);
      st.D += deaths;
      const hospTarget = st.I * (1 - d.asymptomaticFrac) * d.hospRate;
      st.H = st.H * 0.72 + hospTarget * 0.28;
      st.newCases = newE;
      st.newDeaths = deaths;
      st.cumulative += newE;
      st.N = st.S + st.E + st.I + st.R + st.D;

      if (st.firstDay === null && st.cumulative >= 1) {
        st.firstDay = this.day;
        this.events.push({
          day: this.day,
          kind: "arrive",
          text: `Community transmission in ${info.name}.`,
        });
      }

      const overflowing = st.H > info.beds * 1.02;
      if (overflowing && !this.lastOverflow.has(st.id)) {
        this.lastOverflow.add(st.id);
        this.events.push({
          day: this.day,
          kind: "overflow",
          text: `Hospital capacity exceeded in ${info.name}.`,
        });
      }
      if (!overflowing) this.lastOverflow.delete(st.id);

      nationalNew += newE;
      nationalDeaths += deaths;
      infectiousSum += st.I + st.E * 0.3;
      reffNum += foi * st.S * d.infectiousDays;
      reffDen += pressure[i];
    }

    this.lastReff = reffDen > 0.25 ? reffNum / reffDen : 0;
    if (!this.announcedDeath && nationalDeaths >= 1) {
      this.announcedDeath = true;
      this.events.push({ day: this.day, kind: "death", text: "First confirmed deaths recorded." });
    }
    if (this.vaxOn && d.vaxAvailable && !this.announcedVax) {
      this.announcedVax = true;
      this.events.push({
        day: this.day,
        kind: "vax",
        text: "Vaccination campaign is underway.",
      });
    }

    if (infectiousSum > this.peakInfectious) {
      this.peakInfectious = infectiousSum;
      this.peakDay = this.day;
    }

    if (this.events.length > 90) this.events = this.events.slice(-80);
    this.record(nationalNew, nationalDeaths, this.lastReff);
  }

  private record(newCases = 0, newDeaths = 0, reff = 0) {
    const snap = this.snapshot(newCases, newDeaths, reff);
    this.history.push({
      day: snap.day,
      infected: snap.infected,
      deaths: snap.deaths,
      hospitalized: snap.hospitalized,
      newCases: snap.newCases,
      reff: snap.reff,
    });
    if (this.history.length > 760) this.history.splice(0, this.history.length - 740);
  }

  snapshot(newCases?: number, newDeaths?: number, reff?: number): NationalSnap {
    let infected = 0;
    let exposed = 0;
    let infectious = 0;
    let recovered = 0;
    let deaths = 0;
    let hospitalized = 0;
    let cumulative = 0;
    let susceptible = 0;
    let statesHit = 0;
    let overflowStates = 0;
    let nc = 0;
    let nd = 0;
    for (let i = 0; i < this.states.length; i++) {
      const st = this.states[i];
      infected += st.E + st.I;
      exposed += st.E;
      infectious += st.I;
      recovered += st.R;
      deaths += st.D;
      hospitalized += st.H;
      cumulative += st.cumulative;
      susceptible += st.S;
      nc += st.newCases;
      nd += st.newDeaths;
      if (st.cumulative >= 1) statesHit += 1;
      if (st.H > STATES[i].beds) overflowStates += 1;
    }
    return {
      day: this.day,
      month: this.calendarMonth(),
      infected,
      exposed,
      infectious,
      recovered,
      deaths,
      hospitalized,
      newCases: newCases ?? nc,
      newDeaths: newDeaths ?? nd,
      cumulative,
      susceptible,
      reff: reff ?? this.lastReff,
      statesHit,
      overflowStates,
    };
  }
}

export function metricValue(st: StateSim, metric: MapMetric): number {
  if (metric === "active") return st.E + st.I;
  if (metric === "attack") return st.cumulative;
  return st.D;
}

export function metricToT(value: number, metric: MapMetric): number {
  if (metric === "active") {
    return Math.min(1, Math.log10(1 + value) / Math.log10(250000));
  }
  if (metric === "attack") {
    return Math.min(1, Math.log10(1 + value) / Math.log10(4_000_000));
  }
  return Math.min(1, Math.log10(1 + value) / Math.log10(80000));
}

const STOPS: [number, number, number][] = [
  [26, 23, 20],
  [61, 42, 36],
  [107, 58, 50],
  [163, 74, 60],
  [224, 182, 170],
];

export function heatColor(t: number): string {
  const x = Math.min(1, Math.max(0, t));
  const scaled = x * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgb(${r}, ${g}, ${bl})`;
}

export { TOTAL_POP };
