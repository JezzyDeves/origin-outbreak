import { Hospital as HospitalIcon, Star } from "lucide-react";
import { prettyName, type Hospital } from "@/lib/geo";
import { formatCompact } from "@/lib/states";
import { cn } from "@/lib/cn";

type Load = { patients: number; capacity: number };

export function HospitalDetail({
  hospital,
  load,
}: {
  hospital: Hospital;
  load?: Load | null;
}) {
  const occ = load ? load.patients / Math.max(1, load.capacity) : null;
  const overflow = occ !== null && occ > 1;
  const fill = Math.min(1, occ ?? 0);

  return (
    <div className="pb-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-warn">
          <HospitalIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-medium leading-snug">
            {prettyName(hospital.n)}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {prettyName(hospital.c)}, {hospital.s}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Meta k="Type" v={hospital.t || "Hospital"} />
        <Meta k="Ownership" v={hospital.o || "—"} />
        <Meta k="Emergency" v={hospital.e ? "Yes" : "No ER"} />
        <Meta
          k="Est. beds"
          v={hospital.b.toLocaleString("en-US")}
        />
      </div>

      <div className="mt-3 rounded-xl bg-surface px-3 py-2.5">
        <p className="text-[11px] text-subtle">CMS overall rating</p>
        {hospital.r == null ? (
          <p className="mt-1 text-sm text-muted">Not rated</p>
        ) : (
          <div className="mt-1 flex items-center gap-1" aria-label={`${hospital.r} of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-4",
                  i < hospital.r! ? "fill-warn text-warn" : "text-subtle",
                )}
              />
            ))}
            <span className="ml-1 font-mono text-xs tabular-nums text-muted">
              {hospital.r} / 5
            </span>
          </div>
        )}
      </div>

      {load ? (
        <div className="mt-3 rounded-xl bg-surface px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] text-subtle">Allocated patients</p>
            <p
              className={cn(
                "font-mono text-sm tabular-nums",
                overflow ? "text-infect-soft" : "text-fg",
              )}
            >
              {formatCompact(load.patients)} / {load.capacity.toLocaleString("en-US")}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={cn("h-full rounded-full", overflow ? "bg-infect" : "bg-warn")}
              style={{ width: `${Math.round(fill * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-subtle">
            {overflow
              ? "This facility is over its estimated staffed-bed capacity."
              : occ !== null && occ > 0.01
                ? `${Math.round(occ * 100)}% of estimated beds occupied by modeled patients.`
                : "No modeled inpatients assigned yet."}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-subtle">
          Bed counts are estimated from CMS hospital type and star rating (July 2026).
        </p>
      )}
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-2.5">
      <p className="text-[11px] text-subtle">{k}</p>
      <p className="mt-0.5 text-sm leading-snug">{v}</p>
    </div>
  );
}
