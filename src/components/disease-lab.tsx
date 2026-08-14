import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { PRESETS, MODE_META, doublingDays, serialInterval, type TransmissionMode } from "@/lib/disease";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ControlRow } from "@/components/control-row";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

function pct(n: number, digits = 0) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function DiseaseLab() {
  const disease = useApp((s) => s.disease);
  const preset = useApp((s) => s.preset);
  const setDisease = useApp((s) => s.setDisease);
  const setMode = useApp((s) => s.setMode);
  const applyPreset = useApp((s) => s.applyPreset);
  const setStep = useApp((s) => s.setStep);
  const [advanced, setAdvanced] = useState(false);

  const modes = Object.keys(MODE_META) as TransmissionMode[];

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border/80 bg-bg/90 px-3 py-2 backdrop-blur-sm pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-fg"
          onClick={() => setStep("home")}
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">Step 1</p>
          <h1 className="truncate font-display text-xl font-medium">Pathogen</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-28">
        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto pb-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={cn(
                "h-10 shrink-0 rounded-full px-3.5 text-sm transition-colors duration-150",
                preset === p.id
                  ? "bg-primary text-primary-fg"
                  : "bg-elevated text-muted hover:text-fg",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-subtle">
          Name
        </label>
        <input
          value={disease.name}
          onChange={(e) => setDisease({ name: e.target.value.slice(0, 32) })}
          className="mt-1.5 h-12 rounded-xl bg-elevated px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-fg/40"
          placeholder="Pathogen name"
        />

        <section className="mt-7">
          <h2 className="font-display text-lg font-medium">Transmission</h2>
          <ControlRow
            label="Basic reproduction number"
            hint="Average new infections from one case in a fully susceptible population."
            valueLabel={`R₀ ${disease.r0.toFixed(2)}`}
            min={0.8}
            max={18}
            step={0.05}
            value={disease.r0}
            onChange={(v) => setDisease({ r0: v })}
          />
          <ControlRow
            label="Super-spreading"
            hint="Lower = a few events drive most spread. Higher = even mixing."
            valueLabel={
              disease.overdispersion < 0.3
                ? "Clustered"
                : disease.overdispersion > 0.65
                  ? "Even"
                  : "Mixed"
            }
            min={0.1}
            max={1}
            step={0.05}
            value={disease.overdispersion}
            onChange={(v) => setDisease({ overdispersion: v })}
          />
          <p className="mt-3 text-sm font-medium">Routes</p>
          <p className="text-xs text-subtle">How the pathogen leaves a host. Mix freely.</p>
          <div className="mt-2 space-y-1">
            {modes.map((m) => (
              <ControlRow
                key={m}
                label={MODE_META[m].label}
                hint={MODE_META[m].hint}
                valueLabel={pct(disease.modes[m])}
                min={0}
                max={1}
                step={0.05}
                value={disease.modes[m]}
                onChange={(v) => setMode(m, v)}
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-lg font-medium">Course</h2>
          <ControlRow
            label="Incubation"
            hint="Days from exposure to infectiousness / symptoms."
            valueLabel={`${disease.incubationDays.toFixed(1)} d`}
            min={1}
            max={21}
            step={0.5}
            value={disease.incubationDays}
            onChange={(v) => setDisease({ incubationDays: v })}
          />
          <ControlRow
            label="Infectious period"
            valueLabel={`${disease.infectiousDays.toFixed(1)} d`}
            min={1.5}
            max={21}
            step={0.5}
            value={disease.infectiousDays}
            onChange={(v) => setDisease({ infectiousDays: v })}
          />
          <ControlRow
            label="Pre-symptomatic window"
            hint="Days a person can infect others before they feel sick."
            valueLabel={`${disease.preSymDays.toFixed(1)} d`}
            min={0}
            max={6}
            step={0.1}
            value={disease.preSymDays}
            onChange={(v) => setDisease({ preSymDays: v })}
          />
          <ControlRow
            label="Asymptomatic share"
            valueLabel={pct(disease.asymptomaticFrac)}
            min={0}
            max={0.85}
            step={0.01}
            value={disease.asymptomaticFrac}
            onChange={(v) => setDisease({ asymptomaticFrac: v })}
          />
        </section>

        <section className="mt-8">
          <h2 className="font-display text-lg font-medium">Severity</h2>
          <ControlRow
            label="Infection fatality"
            hint="Share of infections that end in death, before hospital overflow."
            valueLabel={
              disease.ifr < 0.001
                ? `${(disease.ifr * 100).toFixed(3)}%`
                : pct(disease.ifr, disease.ifr < 0.02 ? 2 : 1)
            }
            min={0.00005}
            max={0.25}
            step={0.00005}
            value={disease.ifr}
            onChange={(v) => setDisease({ ifr: v })}
          />
          <ControlRow
            label="Hospitalization"
            valueLabel={pct(disease.hospRate, 1)}
            min={0}
            max={0.4}
            step={0.005}
            value={disease.hospRate}
            onChange={(v) => setDisease({ hospRate: v })}
          />
          <ControlRow
            label="Age targeting"
            hint="Negative favors children; positive favors older adults."
            valueLabel={
              disease.ageBias < -0.25
                ? "Younger"
                : disease.ageBias > 0.25
                  ? "Older"
                  : "Flat"
            }
            min={-1}
            max={1}
            step={0.05}
            value={disease.ageBias}
            onChange={(v) => setDisease({ ageBias: v })}
          />
        </section>

        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="mt-8 flex h-11 items-center justify-between rounded-xl bg-surface px-4 text-sm shadow-[var(--shadow-border)]"
        >
          Immunity, season, vaccine
          <ChevronDown className={cn("size-4 text-muted transition-transform", advanced && "rotate-180")} />
        </button>

        {advanced ? (
          <div className="mt-2 rounded-2xl bg-surface p-4 pt-2 shadow-[var(--shadow-border)]">
            <ControlRow
              label="Prior immunity"
              valueLabel={pct(disease.priorImmunity)}
              min={0}
              max={0.95}
              step={0.01}
              value={disease.priorImmunity}
              onChange={(v) => setDisease({ priorImmunity: v })}
            />
            <ControlRow
              label="Immunity lasts"
              valueLabel={
                disease.immunityDays >= 3000
                  ? "Lifelong"
                  : `${Math.round(disease.immunityDays / 30)} mo`
              }
              min={60}
              max={3650}
              step={10}
              value={disease.immunityDays}
              onChange={(v) => setDisease({ immunityDays: v })}
            />
            <ControlRow
              label="Seasonal swing"
              hint="Winter or summer peak, depending on month below."
              valueLabel={pct(disease.seasonality)}
              min={0}
              max={1}
              step={0.05}
              value={disease.seasonality}
              onChange={(v) => setDisease({ seasonality: v })}
            />
            <ControlRow
              label="Seasonal peak month"
              valueLabel={["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][disease.peakMonth] ?? "Jan"}
              min={0}
              max={11}
              step={1}
              value={disease.peakMonth}
              onChange={(v) => setDisease({ peakMonth: v })}
            />
            <ControlRow
              label="Surface stability"
              valueLabel={`${Math.round(disease.surfaceHours)} h`}
              min={0}
              max={72}
              step={1}
              value={disease.surfaceHours}
              onChange={(v) => setDisease({ surfaceHours: v })}
            />
            <div className="mt-3 flex items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium">Vaccine available</p>
                <p className="text-xs text-subtle">Can be switched on during the run.</p>
              </div>
              <Switch
                checked={disease.vaxAvailable}
                onCheckedChange={(v) => setDisease({ vaxAvailable: v })}
              />
            </div>
            {disease.vaxAvailable ? (
              <>
                <ControlRow
                  label="Efficacy"
                  valueLabel={pct(disease.vaxEfficacy)}
                  min={0.2}
                  max={0.98}
                  step={0.01}
                  value={disease.vaxEfficacy}
                  onChange={(v) => setDisease({ vaxEfficacy: v })}
                />
                <ControlRow
                  label="Daily coverage"
                  hint="Share of remaining susceptibles vaccinated each day."
                  valueLabel={pct(disease.vaxDaily, 2)}
                  min={0.0005}
                  max={0.012}
                  step={0.0005}
                  value={disease.vaxDaily}
                  onChange={(v) => setDisease({ vaxDaily: v })}
                />
              </>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl bg-elevated p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
            Field estimate
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat k="R₀" v={disease.r0.toFixed(2)} />
            <Stat k="Doubling" v={`~${doublingDays(disease).toFixed(1)} d`} />
            <Stat k="Serial interval" v={`${serialInterval(disease).toFixed(1)} d`} />
            <Stat
              k="IFR"
              v={disease.ifr < 0.001 ? `${(disease.ifr * 100).toFixed(3)}%` : pct(disease.ifr, 2)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {modes
              .filter((m) => disease.modes[m] > 0.05)
              .map((m) => (
                <Badge key={m}>{MODE_META[m].label}</Badge>
              ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <Button className="w-full" size="lg" onClick={() => setStep("seed")}>
            Set origin
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[11px] text-subtle">{k}</p>
      <p className="font-mono text-lg tabular-nums">{v}</p>
    </div>
  );
}
