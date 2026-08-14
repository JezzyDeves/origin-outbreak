import { PRESETS, type PresetId } from "@/lib/disease";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { UsaMap } from "@/components/usa-map";
import { ArrowRight } from "lucide-react";

const QUICK: PresetId[] = ["flu", "corona", "measles"];

export function HomeScreen() {
  const applyPreset = useApp((s) => s.applyPreset);
  const setStep = useApp((s) => s.setStep);
  const disease = useApp((s) => s.disease);
  const preset = useApp((s) => s.preset);
  const resume = preset === null || (preset !== "novel" && disease.name !== "NOV-26");

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg text-fg">
      <div className="pointer-events-none absolute inset-x-0 top-10 h-[46vh] opacity-50">
        <UsaMap
          states={null}
          metric="active"
          selected={null}
          origin="WA"
          onSelect={() => {}}
          animate
          mobility={0.55}
          layers={{ roads: true, air: true, hospitals: false }}
          className="max-h-full"
        />
      </div>
      <header className="relative z-10 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-subtle">Origin</p>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-end px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-infect-soft">
          U.S. epidemic laboratory
        </p>
        <h1 className="mt-3 max-w-[14ch] font-display text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-5xl">
          Design a pathogen. Watch it move.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          Tune transmission, severity, and season. Seed an origin. Then watch it
          move on a live Census map — along real air corridors, highways, and
          hospital catchments. Your lab stays on this device.
        </p>

        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={() => setStep("lab")}
        >
          {resume ? `Continue ${disease.name}` : "Build a custom disease"}
          <ArrowRight />
        </Button>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Or start from a known class
        </p>
        <div className="mt-3 grid gap-2">
          {PRESETS.filter((p) => QUICK.includes(p.id)).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                applyPreset(p.id);
                setStep("seed");
              }}
              className="flex min-h-14 items-center justify-between rounded-xl bg-surface px-4 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <span>
                <span className="block text-sm font-medium">{p.label}</span>
                <span className="block text-xs text-muted">{p.blurb}</span>
              </span>
              <ArrowRight className="size-4 text-subtle" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
