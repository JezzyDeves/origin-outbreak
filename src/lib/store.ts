import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  PRESETS,
  defaultDisease,
  defaultSeed,
  type Disease,
  type NpiLevel,
  type PresetId,
  type SeedConfig,
} from "./disease";
import { Epidemic, type MapMetric, type NationalSnap } from "./simulation";

export type Step = "home" | "lab" | "seed" | "run";

type Persisted = {
  disease: Disease;
  seed: SeedConfig;
  preset: PresetId | null;
  speed: number;
  metric: MapMetric;
  npi: NpiLevel;
  mobility: number;
  vaxOn: boolean;
  selected: string | null;
};

type AppState = Persisted & {
  step: Step;
  epidemic: Epidemic | null;
  snap: NationalSnap | null;
  playing: boolean;
  setStep: (step: Step) => void;
  setDisease: (patch: Partial<Disease>) => void;
  setMode: (key: keyof Disease["modes"], value: number) => void;
  applyPreset: (id: PresetId) => void;
  setSeed: (patch: Partial<SeedConfig>) => void;
  startRun: () => void;
  resetRun: () => void;
  tick: (days?: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setSelected: (id: string | null) => void;
  setMetric: (metric: MapMetric) => void;
  setNpi: (npi: NpiLevel) => void;
  setMobility: (mobility: number) => void;
  setVaxOn: (on: boolean) => void;
  reroll: () => void;
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      step: "home",
      disease: defaultDisease(),
      seed: defaultSeed(),
      preset: "novel",
      epidemic: null,
      snap: null,
      playing: false,
      speed: 2,
      selected: null,
      metric: "active",
      npi: "none",
      mobility: 1,
      vaxOn: false,
      setStep: (step) => set({ step }),
      setDisease: (patch) => set({ disease: { ...get().disease, ...patch }, preset: null }),
      setMode: (key, value) => {
        const disease = get().disease;
        set({
          disease: { ...disease, modes: { ...disease.modes, [key]: value } },
          preset: null,
        });
      },
      applyPreset: (id) => {
        const found = PRESETS.find((p) => p.id === id);
        if (!found) return;
        set({
          disease: { ...found.disease, modes: { ...found.disease.modes } },
          preset: id,
        });
      },
      setSeed: (patch) => set({ seed: { ...get().seed, ...patch } }),
      startRun: () => {
        const { disease, seed } = get();
        const epidemic = new Epidemic(disease, seed);
        set({
          step: "run",
          epidemic,
          snap: epidemic.snapshot(),
          playing: true,
          selected: seed.origin,
          npi: seed.npi,
          mobility: seed.mobility,
          vaxOn: epidemic.vaxOn,
        });
      },
      resetRun: () => {
        const { disease, seed, npi, mobility, vaxOn } = get();
        const nextSeed = { ...seed, npi };
        const epidemic = new Epidemic(disease, nextSeed);
        epidemic.npi = npi;
        epidemic.mobility = mobility;
        epidemic.vaxOn = vaxOn;
        set({
          epidemic,
          snap: epidemic.snapshot(),
          playing: false,
          selected: seed.origin,
        });
      },
      tick: (days = 1) => {
        const { epidemic } = get();
        if (!epidemic) return;
        const cap = 730;
        for (let i = 0; i < days; i++) {
          if (epidemic.day >= cap) {
            set({ playing: false, snap: epidemic.snapshot() });
            return;
          }
          epidemic.step();
        }
        set({ snap: epidemic.snapshot() });
      },
      setPlaying: (playing) => set({ playing }),
      setSpeed: (speed) => set({ speed }),
      setSelected: (id) => set({ selected: id }),
      setMetric: (metric) => set({ metric }),
      setNpi: (npi) => {
        const { epidemic } = get();
        if (epidemic) epidemic.npi = npi;
        set({ npi });
      },
      setMobility: (mobility) => {
        const { epidemic } = get();
        if (epidemic) epidemic.mobility = mobility;
        set({ mobility });
      },
      setVaxOn: (on) => {
        const { epidemic } = get();
        if (epidemic) epidemic.vaxOn = on;
        set({ vaxOn: on });
      },
      reroll: () => {
        const seed = { ...get().seed, rngSalt: get().seed.rngSalt + 1 };
        set({ seed });
        const epidemic = new Epidemic(get().disease, seed);
        epidemic.npi = get().npi;
        epidemic.mobility = get().mobility;
        epidemic.vaxOn = get().vaxOn;
        set({ epidemic, snap: epidemic.snapshot(), playing: false });
      },
    }),
    {
      name: "origin-lab",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (s): Persisted => ({
        disease: s.disease,
        seed: s.seed,
        preset: s.preset,
        speed: s.speed,
        metric: s.metric,
        npi: s.npi,
        mobility: s.mobility,
        vaxOn: s.vaxOn,
        selected: s.selected,
      }),
    },
  ),
);
