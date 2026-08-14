import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  Hospital as HospitalIcon,
  Pause,
  Plane,
  Play,
  RotateCcw,
  Route,
  Settings2,
  SkipForward,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MONTHS, NPI_META, type NpiLevel } from "@/lib/disease";
import { STATE_BY_ID, TOTAL_POP, formatCompact, formatPop } from "@/lib/states";
import {
  hospitalOccupancy,
  hospitalsInState,
  type Hospital,
} from "@/lib/geo";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ControlRow } from "@/components/control-row";
import { UsaMap, type MapLayers } from "@/components/usa-map";
import { HospitalDetail } from "@/components/hospital-card";
import { cn } from "@/lib/cn";
import type { MapMetric } from "@/lib/simulation";

const SPEEDS = [1, 2, 4, 8];
const METRICS: { id: MapMetric; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "attack", label: "Attack" },
  { id: "deaths", label: "Deaths" },
];

export function SimView() {
  const epidemic = useApp((s) => s.epidemic);
  const snap = useApp((s) => s.snap);
  const playing = useApp((s) => s.playing);
  const speed = useApp((s) => s.speed);
  const selected = useApp((s) => s.selected);
  const metric = useApp((s) => s.metric);
  const npi = useApp((s) => s.npi);
  const mobility = useApp((s) => s.mobility);
  const vaxOn = useApp((s) => s.vaxOn);
  const disease = useApp((s) => s.disease);
  const tick = useApp((s) => s.tick);
  const setPlaying = useApp((s) => s.setPlaying);
  const setSpeed = useApp((s) => s.setSpeed);
  const setSelected = useApp((s) => s.setSelected);
  const setMetric = useApp((s) => s.setMetric);
  const setNpi = useApp((s) => s.setNpi);
  const setMobility = useApp((s) => s.setMobility);
  const setVaxOn = useApp((s) => s.setVaxOn);
  const resetRun = useApp((s) => s.resetRun);
  const setStep = useApp((s) => s.setStep);
  const [panel, setPanel] = useState<"none" | "state" | "chart" | "policy" | "hospital">("none");
  const [layers, setLayers] = useState<MapLayers>({ roads: true, air: true, hospitals: true });
  const [pickedHospital, setPickedHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      acc += dt;
      const interval = 520 / speed;
      let steps = 0;
      while (acc >= interval && steps < 6) {
        acc -= interval;
        steps += 1;
      }
      if (steps) tick(steps);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, tick]);

  const st = epidemic?.states.find((s) => s.id === selected) ?? null;
  const info = selected ? STATE_BY_ID[selected] : null;
  const month = snap ? MONTHS[snap.month] : "";
  const localHospitals = selected ? hospitalsInState(selected).length : 0;

  const hospitalLoad = useCallback(
    (h: Hospital) => {
      const sim = epidemic?.states.find((s) => s.id === h.s);
      const beds = STATE_BY_ID[h.s]?.beds ?? h.b;
      return hospitalOccupancy(h, sim?.H ?? 0, beds);
    },
    [epidemic, snap?.day],
  );

  const chart = useMemo(() => {
    const hist = epidemic?.history ?? [];
    const stride = hist.length > 240 ? 3 : 1;
    return hist.filter((_, i) => i % stride === 0 || i === hist.length - 1);
  }, [epidemic, snap?.day]);

  if (!epidemic || !snap) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        Preparing model…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStep("seed");
          }}
          className="grid size-11 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-fg"
        >
          <X className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-medium leading-tight">
            {disease.name}
          </p>
          <p className="font-mono text-[11px] tabular-nums text-muted">
            Day {snap.day} · {month}
          </p>
        </div>
        <Badge tone={snap.reff >= 1 ? "infect" : "ok"}>
          R<sub className="text-[9px]">eff</sub> {snap.reff.toFixed(2)}
        </Badge>
      </header>

      <div className="grid grid-cols-4 gap-1 px-3 pt-2">
        <Hud k="Active" v={formatCompact(snap.infected)} />
        <Hud k="Dead" v={formatCompact(snap.deaths)} tone="infect" />
        <Hud k="Hosp." v={formatCompact(snap.hospitalized)} />
        <Hud k="States" v={`${snap.statesHit}/51`} />
      </div>

      <div className="relative mx-2 mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <UsaMap
          states={epidemic.states}
          metric={metric}
          selected={selected}
          origin={epidemic.seed.origin}
          animate={playing}
          mobility={mobility}
          layers={layers}
          selectedHospital={pickedHospital?.id ?? null}
          hospitalLoad={hospitalLoad}
          onHospital={(h) => {
            setPickedHospital(h);
            setSelected(h.s);
            setPanel("hospital");
          }}
          onSelect={(id) => {
            setSelected(id);
            setPickedHospital(null);
            setPanel("state");
          }}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute left-2 top-2 flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetric(m.id)}
              className={cn(
                "h-8 rounded-full px-2.5 text-[11px] font-medium",
                metric === m.id ? "bg-fg text-primary-fg" : "bg-bg/70 text-muted backdrop-blur-sm",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="absolute right-2 top-2 flex gap-1">
          <LayerBtn
            label="Highways"
            on={layers.roads}
            icon={<Route className="size-3.5" />}
            onClick={() => setLayers((l) => ({ ...l, roads: !l.roads }))}
          />
          <LayerBtn
            label="Air traffic"
            on={layers.air}
            icon={<Plane className="size-3.5" />}
            onClick={() => setLayers((l) => ({ ...l, air: !l.air }))}
          />
          <LayerBtn
            label="Hospitals"
            on={layers.hospitals}
            icon={<HospitalIcon className="size-3.5" />}
            onClick={() => {
              setLayers((l) => {
                const next = { ...l, hospitals: !l.hospitals };
                if (!next.hospitals) {
                  setPickedHospital(null);
                  if (panel === "hospital") setPanel("none");
                }
                return next;
              });
            }}
          />
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5 text-[10px] text-subtle">
          <span>Low</span>
          <span className="h-1.5 w-16 rounded-full bg-[linear-gradient(90deg,var(--color-map-0),var(--color-map-2),var(--color-map-4))]" />
          <span>High</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1 px-3">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className="grid size-12 place-items-center rounded-xl bg-primary text-primary-fg"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
        </button>
        <button
          type="button"
          onClick={() => tick(7)}
          className="grid size-12 place-items-center rounded-xl bg-elevated text-fg"
          aria-label="Advance one week"
        >
          <SkipForward className="size-5" />
        </button>
        <div className="flex flex-1 justify-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "h-11 min-w-11 rounded-lg px-2 font-mono text-xs tabular-nums",
                speed === s ? "bg-elevated text-fg" : "text-muted",
              )}
            >
              {s}×
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPanel(panel === "chart" ? "none" : "chart")}
          className={cn(
            "grid size-12 place-items-center rounded-xl",
            panel === "chart" ? "bg-elevated text-fg" : "text-muted",
          )}
          aria-label="Curve"
        >
          <Activity className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "policy" ? "none" : "policy")}
          className={cn(
            "grid size-12 place-items-center rounded-xl",
            panel === "policy" ? "bg-elevated text-fg" : "text-muted",
          )}
          aria-label="Response"
        >
          <Settings2 className="size-5" />
        </button>
      </div>

      <div className="mt-1 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="truncate text-xs text-subtle">
          {epidemic.events.at(-1)?.text ?? "Model running."}
        </p>
      </div>

      {panel !== "none" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 max-h-[72vh] overflow-y-auto rounded-t-2xl bg-elevated px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-[var(--shadow-border)]">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 truncate font-display text-lg font-medium">
              {panel === "state" && (info?.name ?? "State")}
              {panel === "chart" && "National curve"}
              {panel === "policy" && "Response"}
              {panel === "hospital" && "Hospital"}
            </h2>
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-lg text-muted"
              aria-label="Close panel"
              onClick={() => setPanel("none")}
            >
              <ChevronDown className="size-5" />
            </button>
          </div>

          {panel === "hospital" && pickedHospital ? (
            <HospitalDetail hospital={pickedHospital} load={hospitalLoad(pickedHospital)} />
          ) : null}

          {panel === "state" && st && info ? (
            <div className="pb-2">
              <p className="text-xs text-muted">
                {formatPop(info.pop)} · {info.region} · {localHospitals.toLocaleString("en-US")}{" "}
                hospitals · {info.beds.toLocaleString("en-US")} est. beds
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat k="Active" v={formatCompact(st.E + st.I)} />
                <Stat k="Infectious" v={formatCompact(st.I)} />
                <Stat k="Cumulative" v={formatCompact(st.cumulative)} />
                <Stat k="Deaths" v={formatCompact(st.D)} />
                <Stat k="Hospital" v={formatCompact(st.H)} />
                <Stat k="Susceptible" v={`${((st.S / st.N) * 100).toFixed(1)}%`} />
              </div>
              <p className="mt-3 text-xs text-subtle">
                {st.firstDay === null
                  ? "No detected transmission yet."
                  : st.firstDay === 0
                    ? "Seeded on day 0."
                    : `First local cases on day ${st.firstDay}.`}
                {st.H > info.beds ? " Hospitals are over capacity." : ""}
              </p>
            </div>
          ) : null}

          {panel === "chart" ? (
            <div className="pb-2">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="inf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#b54a3a" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#b54a3a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "#201c18",
                        border: "1px solid #2c2822",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelFormatter={(d) => `Day ${d}`}
                      formatter={(value, name) => [
                        formatCompact(Number(value ?? 0)),
                        name === "infected" ? "Active" : name === "deaths" ? "Deaths" : String(name),
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="infected"
                      stroke="#d4a89c"
                      fill="url(#inf)"
                      strokeWidth={1.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="deaths"
                      stroke="#efe8dc"
                      fill="transparent"
                      strokeWidth={1.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-subtle">
                Peak infectious load around day {epidemic.peakDay || "—"}.{" "}
                {snap.cumulative < 50_000
                  ? `${formatCompact(snap.cumulative)} infections recorded.`
                  : `${((snap.cumulative / TOTAL_POP) * 100).toFixed(2)}% of the U.S. has been infected.`}
              </p>
              <ol className="mt-3 max-h-36 space-y-1.5 overflow-y-auto text-xs text-muted">
                {[...epidemic.events].slice(-12).reverse().map((e, i) => (
                  <li key={`${e.day}-${i}`}>
                    <span className="font-mono text-subtle">D{e.day}</span> {e.text}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {panel === "policy" ? (
            <div className="pb-3">
              <p className="text-xs text-subtle">
                Change the country mid-run. Effects apply on the next day. Air corridors
                follow scheduled U.S. routes; highways use Natural Earth.
              </p>
              <p className="mt-3 text-sm font-medium">Non-pharmaceutical response</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(NPI_META) as NpiLevel[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setNpi(id)}
                    className={cn(
                      "min-h-12 rounded-xl px-3 py-2 text-left text-sm",
                      npi === id ? "bg-surface text-fg" : "text-muted",
                    )}
                  >
                    {NPI_META[id].label}
                  </button>
                ))}
              </div>
              <ControlRow
                className="mt-2"
                label="Mobility"
                valueLabel={`${Math.round(mobility * 100)}%`}
                min={0.2}
                max={1.3}
                step={0.05}
                value={mobility}
                onChange={setMobility}
              />
              <div className="mt-2 flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Vaccination</p>
                  <p className="text-xs text-subtle">
                    {disease.vaxAvailable
                      ? `${Math.round(disease.vaxEfficacy * 100)}% effective`
                      : "Not configured on this pathogen."}
                  </p>
                </div>
                <Switch
                  checked={vaxOn && disease.vaxAvailable}
                  disabled={!disease.vaxAvailable}
                  onCheckedChange={setVaxOn}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={resetRun}>
                  <RotateCcw />
                  Replay
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPlaying(false);
                    setStep("lab");
                  }}
                >
                  Edit pathogen
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LayerBtn({
  label,
  on,
  icon,
  onClick,
}: {
  label: string;
  on: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "grid size-11 place-items-center rounded-full backdrop-blur-sm",
        on ? "bg-fg text-primary-fg" : "bg-bg/70 text-muted",
      )}
    >
      {icon}
    </button>
  );
}

function Hud({ k, v, tone }: { k: string; v: string; tone?: "infect" }) {
  return (
    <div className="rounded-lg bg-surface px-2 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">{k}</p>
      <p
        className={cn(
          "font-mono text-sm tabular-nums",
          tone === "infect" ? "text-infect-soft" : "text-fg",
        )}
      >
        {v}
      </p>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-2.5">
      <p className="text-[11px] text-subtle">{k}</p>
      <p className="font-mono text-lg tabular-nums">{v}</p>
    </div>
  );
}
