/**
 * Three variants of Clock rate control and Movement appearance, switchable via `?variant=`,
 * on the existing `/` play map (schematic Places / Corridors). Throwaway. Do not merge to main.
 */
import { useState } from "react";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { VariantConvoy } from "@/components/clock-movement/variant-convoy";
import { VariantHeat } from "@/components/clock-movement/variant-heat";
import { VariantInspector } from "@/components/clock-movement/variant-inspector";
import { usePrototypeClock } from "@/components/clock-movement/use-prototype-clock";
import { ORIGIN_PLACE, type MapPick } from "@/lib/prototype-map-look";

export const CLOCK_MOVE_VARIANTS = [
  { key: "A", name: "Convoy" },
  { key: "B", name: "Heat" },
  { key: "C", name: "Ledger" },
] as const;

export type ClockMoveKey = (typeof CLOCK_MOVE_VARIANTS)[number]["key"];

type Props = {
  variant: ClockMoveKey;
  onVariant: (key: ClockMoveKey) => void;
};

export function ClockMovementPrototype({ variant, onVariant }: Props) {
  const clock = usePrototypeClock();
  const [pick, setPick] = useState<MapPick | null>({ kind: "place", id: ORIGIN_PLACE });

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <div className="min-h-0 flex-1">
        {variant === "A" ? <VariantConvoy clock={clock} pick={pick} onPick={setPick} /> : null}
        {variant === "B" ? <VariantHeat clock={clock} pick={pick} onPick={setPick} /> : null}
        {variant === "C" ? <VariantInspector clock={clock} pick={pick} onPick={setPick} /> : null}
      </div>
      <PrototypeSwitcher
        variants={[...CLOCK_MOVE_VARIANTS]}
        current={variant}
        onChange={(key) => onVariant(key as ClockMoveKey)}
      />
    </div>
  );
}
