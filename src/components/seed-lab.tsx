import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { MONTHS, NPI_META, type IntroKind, type NpiLevel } from "@/lib/disease";
import { STATES, STATE_BY_ID, formatPop } from "@/lib/states";
import { hospitalsInState, type Hospital } from "@/lib/geo";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ControlRow } from "@/components/control-row";
import { UsaMap } from "@/components/usa-map";
import { HospitalDetail } from "@/components/hospital-card";
import { cn } from "@/lib/cn";

const INTROS: { id: IntroKind; label: string; hint: string }[] = [
  { id: "community", label: "Community", hint: "A local cluster in one state." },
  { id: "airport", label: "Air hubs", hint: "Index plus silent seeds in the busiest FAA hubs." },
  { id: "multi", label: "Multi-city", hint: "Same week in CA, TX, NY, FL, and origin." },
];

const NPIS = Object.entries(NPI_META) as [NpiLevel, (typeof NPI_META)[NpiLevel]][];

export function SeedLab() {
  const seed = useApp((s) => s.seed);
  const disease = useApp((s) => s.disease);
  const setSeed = useApp((s) => s.setSeed);
  const setStep = useApp((s) => s.setStep);
  const startRun = useApp((s) => s.startRun);
  const origin = STATE_BY_ID[seed.origin];
  const [picked, setPicked] = useState<Hospital | null>(null);
  const hospCount = hospitalsInState(seed.origin).length;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border/80 bg-bg/90 px-3 py-2 backdrop-blur-sm pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-fg"
          onClick={() => setStep("lab")}
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">Step 2</p>
          <h1 className="truncate font-display text-xl font-medium">Origin</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-28">
        <p className="mt-4 text-sm text-muted">
          Tap a state to place patient zero for{" "}
          <span className="text-fg">{disease.name}</span>. Tap a hospital pin for
          CMS details.
        </p>

        <div className="mt-3 overflow-hidden rounded-2xl bg-surface p-2 shadow-[var(--shadow-border)]">
          <UsaMap
            states={null}
            metric="active"
            selected={seed.origin}
            origin={seed.origin}
            animate
            mobility={0.85}
            layers={{ roads: true, air: true, hospitals: true }}
            selectedHospital={picked?.id ?? null}
            onHospital={(h) => {
              setPicked(h);
              setSeed({ origin: h.s });
            }}
            onSelect={(id) => {
              setSeed({ origin: id });
              setPicked(null);
            }}
            className="h-[34vh] min-h-48"
          />
        </div>

        {picked ? (
          <div className="mt-3 rounded-2xl bg-elevated px-4 pt-3 shadow-[var(--shadow-border)]">
            <HospitalDetail hospital={picked} />
            <button
              type="button"
              className="mb-3 h-11 w-full rounded-lg text-sm text-muted"
              onClick={() => setPicked(null)}
            >
              Close hospital
            </button>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl font-medium">{origin?.name}</p>
            <p className="text-xs text-muted">
              {formatPop(origin?.pop ?? 0)} people · {hospCount} hospitals · {origin?.region}
            </p>
          </div>
          <label className="sr-only" htmlFor="state-select">
            Origin state
          </label>
          <select
            id="state-select"
            value={seed.origin}
            onChange={(e) => {
              setSeed({ origin: e.target.value });
              setPicked(null);
            }}
            className="h-11 max-w-[46%] rounded-lg bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
          >
            {STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <ControlRow
          className="mt-4"
          label="Index cases"
          hint="People infectious or incubating on day zero."
          valueLabel={String(seed.initialCases)}
          min={1}
          max={400}
          step={1}
          value={seed.initialCases}
          onChange={(v) => setSeed({ initialCases: Math.round(v) })}
        />

        <p className="mt-5 text-sm font-medium">How it arrives</p>
        <div className="mt-2 grid gap-2">
          {INTROS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSeed({ intro: item.id })}
              className={cn(
                "rounded-xl px-4 py-3 text-left shadow-[var(--shadow-border)] transition-colors duration-150",
                seed.intro === item.id ? "bg-elevated text-fg" : "bg-surface text-muted",
              )}
            >
              <span className="block text-sm font-medium text-fg">{item.label}</span>
              <span className="block text-xs text-subtle">{item.hint}</span>
            </button>
          ))}
        </div>

        <ControlRow
          className="mt-5"
          label="Start month"
          hint="Sets the seasonal clock."
          valueLabel={MONTHS[seed.startMonth]}
          min={0}
          max={11}
          step={1}
          value={seed.startMonth}
          onChange={(v) => setSeed({ startMonth: v })}
        />

        <ControlRow
          label="Baseline mobility"
          hint="How much people still move between states."
          valueLabel={`${Math.round(seed.mobility * 100)}%`}
          min={0.25}
          max={1.3}
          step={0.05}
          value={seed.mobility}
          onChange={(v) => setSeed({ mobility: v })}
        />

        <p className="mt-5 text-sm font-medium">Opening response</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {NPIS.map(([id, meta]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSeed({ npi: id })}
              className={cn(
                "min-h-16 rounded-xl px-3 py-2.5 text-left shadow-[var(--shadow-border)]",
                seed.npi === id ? "bg-elevated text-fg" : "bg-surface text-muted",
              )}
            >
              <span className="block text-sm font-medium text-fg">{meta.label}</span>
              <span className="block text-[11px] leading-snug text-subtle">{meta.hint}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-subtle">
          Map uses Census cartography, CMS hospital records (July 2026), FAA 2025
          enplanements, OpenFlights scheduled routes, and Natural Earth highways.
          Staffed beds are estimated from facility type and CMS star rating.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <Button className="w-full" size="lg" onClick={startRun}>
            Begin outbreak
            <Play className="ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
