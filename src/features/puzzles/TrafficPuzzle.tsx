"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BudgetMeter } from "@/components/ui/BudgetMeter";
import { percent } from "@/lib/formatting";
import {
  type ComponentKind,
  type Placement,
  type TrafficLevel,
  evaluate,
  totalCost,
} from "@/engines/traffic/engine";

interface TrafficPuzzleProps {
  level: TrafficLevel;
  onResult: (cleared: boolean, score: number) => void;
}

export function TrafficPuzzle({ level, onResult }: TrafficPuzzleProps) {
  const [placement, setPlacement] = useState<Placement>(() => ({ ...level.baseline }));
  const [checked, setChecked] = useState(false);

  const verdict = useMemo(() => evaluate(placement, level), [placement, level]);
  const peakArrivals = Math.max(...level.arrivalsPerTick);

  function adjust(kind: ComponentKind, delta: number, maxUnits: number) {
    setPlacement((current) => ({
      ...current,
      [kind]: Math.min(maxUnits, Math.max(0, (current[kind] ?? 0) + delta)),
    }));
    setChecked(false);
  }

  function handleCheck() {
    setChecked(true);
    onResult(verdict.cleared, totalCost(placement, level));
  }

  return (
    <div className="space-y-4">
      <BudgetMeter label="Spend" spent={verdict.spend} budget={level.budget} unit="credits" />

      <div className="grid gap-3 md:grid-cols-2">
        {level.available.map((spec) => (
          <section key={spec.kind} className="rounded-panel border border-ink-edge bg-ink p-3">
            <header className="flex items-baseline justify-between">
              <h4 className="text-base">{spec.label}</h4>
              <span className="numeric text-xs text-sky">{spec.costPerUnit} credits each</span>
            </header>
            <p className="mt-1 text-xs text-cream-muted">{spec.description}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => adjust(spec.kind, -1, spec.maxUnits)}
                disabled={(placement[spec.kind] ?? 0) === 0}
                aria-label={`Remove one ${spec.label}`}
              >
                -
              </Button>
              <span className="numeric w-16 text-center text-lg">{placement[spec.kind] ?? 0}</span>
              <Button
                variant="secondary"
                onClick={() => adjust(spec.kind, 1, spec.maxUnits)}
                disabled={(placement[spec.kind] ?? 0) >= spec.maxUnits}
                aria-label={`Add one ${spec.label}`}
              >
                +
              </Button>
              <span className="numeric text-xs text-cream-muted">max {spec.maxUnits}</span>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-panel border border-ink-edge bg-ink-deep p-4">
        <h4 className="eyebrow mb-3 text-cream-muted">Traffic over time</h4>
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Per tick outcome chart">
          {verdict.result.ticks.map((tick) => {
            const scale = (value: number) => `${(value / peakArrivals) * 100}%`;
            return (
              <div key={tick.tick} className="flex flex-1 flex-col justify-end gap-[1px]">
                <div className="bg-rose" style={{ height: scale(tick.dropped) }} title={`${tick.dropped} dropped`} />
                <div className="bg-umber-light" style={{ height: scale(tick.queued) }} title={`${tick.queued} queued`} />
                <div className="bg-sky" style={{ height: scale(tick.servedByApp) }} title={`${tick.servedByApp} served by app`} />
                <div className="bg-cream" style={{ height: scale(tick.servedByCache) }} title={`${tick.servedByCache} served by cache`} />
              </div>
            );
          })}
        </div>
        <ul className="eyebrow mt-3 flex flex-wrap gap-4 text-cream-muted">
          <li><span className="mr-2 inline-block h-2 w-2 bg-cream" />cache</li>
          <li><span className="mr-2 inline-block h-2 w-2 bg-sky" />app</li>
          <li><span className="mr-2 inline-block h-2 w-2 bg-umber-light" />queued</li>
          <li><span className="mr-2 inline-block h-2 w-2 bg-rose" />dropped</li>
        </ul>
      </section>

      <dl className="numeric grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <div>
          <dt className="eyebrow text-cream-muted">Drop rate</dt>
          <dd className={verdict.meetsSla ? "text-sky" : "text-rose"}>{percent(verdict.result.dropRate, 2)}</dd>
        </div>
        <div>
          <dt className="eyebrow text-cream-muted">SLA ceiling</dt>
          <dd>{percent(level.maxDropRate, 2)}</dd>
        </div>
        <div>
          <dt className="eyebrow text-cream-muted">Peak queue</dt>
          <dd>{verdict.result.peakQueue}</dd>
        </div>
      </dl>

      <Button onClick={handleCheck}>Run the check</Button>

      {checked ? (
        <p
          className={`rounded-panel border px-4 py-3 text-sm ${
            verdict.cleared ? "border-sky text-sky" : "border-rose text-rose"
          }`}
          role="status"
        >
          {verdict.cleared
            ? `Cleared at ${verdict.spend} credits with a ${percent(verdict.result.dropRate, 2)} drop rate.`
            : !verdict.withinBudget
              ? `This design works but costs ${verdict.spend} credits against a budget of ${level.budget}.`
              : `Drop rate is ${percent(verdict.result.dropRate, 2)}, above the ${percent(level.maxDropRate, 2)} ceiling. Something in the chain is still too narrow.`}
        </p>
      ) : null}
    </div>
  );
}
