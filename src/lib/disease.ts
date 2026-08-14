export type TransmissionMode = "droplet" | "aerosol" | "contact" | "fecal" | "vector";

export type NpiLevel = "none" | "mild" | "moderate" | "strict";

export type IntroKind = "community" | "airport" | "multi";

export type Disease = {
  name: string;
  r0: number;
  incubationDays: number;
  infectiousDays: number;
  preSymDays: number;
  preSymInfect: number;
  asymptomaticFrac: number;
  asymptomaticInfect: number;
  ifr: number;
  hospRate: number;
  ageBias: number;
  modes: Record<TransmissionMode, number>;
  surfaceHours: number;
  seasonality: number;
  peakMonth: number;
  priorImmunity: number;
  immunityDays: number;
  vaxAvailable: boolean;
  vaxEfficacy: number;
  vaxDaily: number;
  overdispersion: number;
};

export type SeedConfig = {
  origin: string;
  extraOrigins: string[];
  initialCases: number;
  startMonth: number;
  intro: IntroKind;
  mobility: number;
  npi: NpiLevel;
  rngSalt: number;
};

export const MODE_META: Record<
  TransmissionMode,
  { label: string; hint: string }
> = {
  droplet: {
    label: "Droplet",
    hint: "Coughs and close talk. Stronger indoors in winter.",
  },
  aerosol: {
    label: "Aerosol",
    hint: "Fine airborne particles. Favors dense indoor cities.",
  },
  contact: {
    label: "Contact",
    hint: "Hands and surfaces. Weaker across long-haul flights.",
  },
  fecal: {
    label: "Fecal–oral",
    hint: "Food, water, sanitation. Slow geographic jump.",
  },
  vector: {
    label: "Vector",
    hint: "Mosquitoes or ticks. Summer, South and Gulf.",
  },
};

export const NPI_META: Record<NpiLevel, { label: string; beta: number; mobility: number; hint: string }> = {
  none: { label: "None", beta: 1, mobility: 1, hint: "Business as usual." },
  mild: { label: "Advisory", beta: 0.86, mobility: 0.92, hint: "Hygiene, remote options, some masking." },
  moderate: { label: "Distancing", beta: 0.62, mobility: 0.7, hint: "Schools hybrid, offices thinned, gatherings cut." },
  strict: { label: "Stay-home", beta: 0.38, mobility: 0.42, hint: "Stay-at-home, most venues closed, travel crushed." },
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function blankModes(): Record<TransmissionMode, number> {
  return { droplet: 0, aerosol: 0, contact: 0, fecal: 0, vector: 0 };
}

export function defaultDisease(): Disease {
  return {
    name: "NOV-26",
    r0: 2.6,
    incubationDays: 5,
    infectiousDays: 7,
    preSymDays: 2,
    preSymInfect: 0.7,
    asymptomaticFrac: 0.3,
    asymptomaticInfect: 0.45,
    ifr: 0.006,
    hospRate: 0.04,
    ageBias: 0.55,
    modes: { droplet: 0.7, aerosol: 0.55, contact: 0.25, fecal: 0, vector: 0 },
    surfaceHours: 12,
    seasonality: 0.35,
    peakMonth: 0,
    priorImmunity: 0,
    immunityDays: 540,
    vaxAvailable: false,
    vaxEfficacy: 0.75,
    vaxDaily: 0.003,
    overdispersion: 0.35,
  };
}

export type PresetId = "flu" | "corona" | "measles" | "norovirus" | "sars" | "novel";

export const PRESETS: {
  id: PresetId;
  label: string;
  blurb: string;
  disease: Disease;
}[] = [
  {
    id: "flu",
    label: "Seasonal flu",
    blurb: "Winter waves, modest kill rate, short memory.",
    disease: {
      name: "Influenza A",
      r0: 1.35,
      incubationDays: 2,
      infectiousDays: 5,
      preSymDays: 1,
      preSymInfect: 0.5,
      asymptomaticFrac: 0.25,
      asymptomaticInfect: 0.4,
      ifr: 0.001,
      hospRate: 0.015,
      ageBias: 0.7,
      modes: { droplet: 0.9, aerosol: 0.25, contact: 0.35, fecal: 0, vector: 0 },
      surfaceHours: 8,
      seasonality: 0.7,
      peakMonth: 1,
      priorImmunity: 0.28,
      immunityDays: 280,
      vaxAvailable: true,
      vaxEfficacy: 0.45,
      vaxDaily: 0.004,
      overdispersion: 0.55,
    },
  },
  {
    id: "corona",
    label: "Novel coronavirus",
    blurb: "Pre-symptomatic spread, city-first, long tail.",
    disease: {
      name: "SARS-like CoV",
      r0: 2.8,
      incubationDays: 5,
      infectiousDays: 8,
      preSymDays: 2,
      preSymInfect: 0.75,
      asymptomaticFrac: 0.32,
      asymptomaticInfect: 0.5,
      ifr: 0.007,
      hospRate: 0.045,
      ageBias: 0.75,
      modes: { droplet: 0.65, aerosol: 0.7, contact: 0.2, fecal: 0.05, vector: 0 },
      surfaceHours: 16,
      seasonality: 0.28,
      peakMonth: 0,
      priorImmunity: 0,
      immunityDays: 400,
      vaxAvailable: false,
      vaxEfficacy: 0.78,
      vaxDaily: 0.0025,
      overdispersion: 0.28,
    },
  },
  {
    id: "measles",
    label: "Measles-class",
    blurb: "Extreme airborne R0. Burns through susceptibles.",
    disease: {
      name: "Morbilliform",
      r0: 14,
      incubationDays: 10,
      infectiousDays: 8,
      preSymDays: 3,
      preSymInfect: 0.85,
      asymptomaticFrac: 0.08,
      asymptomaticInfect: 0.3,
      ifr: 0.0015,
      hospRate: 0.08,
      ageBias: -0.45,
      modes: { droplet: 0.4, aerosol: 1, contact: 0.15, fecal: 0, vector: 0 },
      surfaceHours: 2,
      seasonality: 0.2,
      peakMonth: 3,
      priorImmunity: 0.88,
      immunityDays: 3650,
      vaxAvailable: true,
      vaxEfficacy: 0.97,
      vaxDaily: 0.001,
      overdispersion: 0.45,
    },
  },
  {
    id: "norovirus",
    label: "Norovirus-like",
    blurb: "Gut pathogen. Surfaces, food, short immunity.",
    disease: {
      name: "Calici-X",
      r0: 2.1,
      incubationDays: 1.5,
      infectiousDays: 3,
      preSymDays: 0.4,
      preSymInfect: 0.4,
      asymptomaticFrac: 0.2,
      asymptomaticInfect: 0.35,
      ifr: 0.00008,
      hospRate: 0.006,
      ageBias: 0.25,
      modes: { droplet: 0.05, aerosol: 0.05, contact: 0.7, fecal: 1, vector: 0 },
      surfaceHours: 48,
      seasonality: 0.45,
      peakMonth: 0,
      priorImmunity: 0.15,
      immunityDays: 90,
      vaxAvailable: false,
      vaxEfficacy: 0.4,
      vaxDaily: 0.001,
      overdispersion: 0.4,
    },
  },
  {
    id: "sars",
    label: "High-fatality SARS",
    blurb: "Sick people spread it. Lethal, slower stealth.",
    disease: {
      name: "SARS-classic",
      r0: 2.2,
      incubationDays: 5,
      infectiousDays: 10,
      preSymDays: 0.2,
      preSymInfect: 0.15,
      asymptomaticFrac: 0.08,
      asymptomaticInfect: 0.15,
      ifr: 0.1,
      hospRate: 0.22,
      ageBias: 0.65,
      modes: { droplet: 0.85, aerosol: 0.35, contact: 0.3, fecal: 0.1, vector: 0 },
      surfaceHours: 20,
      seasonality: 0.2,
      peakMonth: 1,
      priorImmunity: 0,
      immunityDays: 900,
      vaxAvailable: false,
      vaxEfficacy: 0.7,
      vaxDaily: 0.002,
      overdispersion: 0.5,
    },
  },
  {
    id: "novel",
    label: "Blank pathogen",
    blurb: "Start from a clean sheet and tune every lever.",
    disease: defaultDisease(),
  },
];

export function defaultSeed(): SeedConfig {
  return {
    origin: "WA",
    extraOrigins: [],
    initialCases: 18,
    startMonth: 10,
    intro: "community",
    mobility: 1,
    npi: "none",
    rngSalt: 1,
  };
}

export function serialInterval(d: Disease): number {
  return Math.max(1, d.incubationDays * 0.55 + d.infectiousDays * 0.35);
}

export function doublingDays(d: Disease): number {
  const r = Math.max(0.05, d.r0 * (1 - d.priorImmunity) - 1);
  return (Math.LN2 / r) * serialInterval(d);
}

export function generationTime(d: Disease): number {
  return serialInterval(d);
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}
