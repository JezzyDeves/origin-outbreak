import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  valueLabel: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  className?: string;
};

export function ControlRow({
  label,
  valueLabel,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  className,
}: Props) {
  return (
    <div className={cn("py-1", className)}>
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-medium text-fg">{label}</label>
        <span className="font-mono text-xs tabular-nums text-muted">{valueLabel}</span>
      </div>
      {hint ? <p className="mt-0.5 text-xs leading-snug text-subtle">{hint}</p> : null}
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}
