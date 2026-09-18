import { formatCompact } from "@/lib/states";
import {
  hopLabel,
  hopsForPlace,
  type DrawnHop,
} from "@/lib/prototype-clock-movement";
import { pickLabel, type MapPick } from "@/lib/prototype-map-look";
import type { PrototypeClock } from "./use-prototype-clock";

type Props = {
  clock: PrototypeClock;
  pick: MapPick | null;
  hop: DrawnHop | null;
  note: string;
};

export function StateDump({ clock, pick, hop, note }: Props) {
  const hh = Math.floor(clock.hourOfDay);
  const mm = Math.floor((clock.hourOfDay % 1) * 60);
  const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  const placeId = pick?.kind === "place" ? pick.id : null;
  const hops = placeId ? hopsForPlace(placeId) : hop ? [hop] : [];
  const road = hops.filter((h) => h.kind === "road");
  const air = hops.filter((h) => h.kind === "air");
  const roadN = road.reduce((s, h) => s + h.trips, 0);
  const airN = air.reduce((s, h) => s + h.paxAB + h.paxBA, 0);

  return (
    <aside
      data-pin="ui"
      className="pointer-events-none absolute left-2 top-2 z-20 max-w-[18rem] rounded-xl bg-bg/85 px-3 py-2 font-mono text-[10px] leading-relaxed text-muted backdrop-blur-sm"
    >
      <p className="text-subtle">{note}</p>
      <p className="text-fg">
        Clock {clock.rates.find((r) => r.id === clock.rate)?.label} ·{" "}
        {clock.playing ? "running" : clock.capped ? "day 730 pause" : "paused"}
      </p>
      <p>
        Day {clock.day} · {time} · {fmtStep(clock.wallSecondsPerStep)} / Sim step
      </p>
      <p>{pickLabel(pick)}</p>
      {hop ? <p>Corridor {hopLabel(hop)}</p> : null}
      {hops.length ? (
        <p>
          Road {formatCompact(roadN)} trips · Air {formatCompact(airN)} pax
        </p>
      ) : (
        <p>Tap a Place to read its Movement.</p>
      )}
    </aside>
  );
}

function fmtStep(sec: number) {
  if (sec >= 3600) return `${Math.round(sec / 3600)} h`;
  if (sec >= 60) return `${Math.round(sec / 60)} min`;
  return `${Math.round(sec)} s`;
}
