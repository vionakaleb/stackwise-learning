interface BudgetMeterProps {
  label: string;
  spent: number;
  budget: number;
  unit: string;
}

const maximumSegments = 40;

export function BudgetMeter({ label, spent, budget, unit }: BudgetMeterProps) {
  const segmentCount = Math.min(budget, maximumSegments);
  const spentSegments = budget === 0 ? 0 : Math.round((spent / budget) * segmentCount);
  const overspent = spent > budget;
  const remaining = budget - spent;

  return (
    <div className="rounded-panel border border-ink-edge bg-ink-deep px-4 py-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="eyebrow text-cream-muted">{label}</span>
        <span className={`numeric text-sm ${overspent ? "text-rose" : "text-cream"}`}>
          {spent} / {budget} {unit}
        </span>
      </div>

      <div
        className="mt-2 flex gap-[2px]"
        role="meter"
        aria-valuenow={spent}
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-label={`${label}: ${spent} of ${budget} ${unit} used`}
      >
        {Array.from({ length: segmentCount }, (_, index) => {
          const isSpent = index < spentSegments;
          const fill = overspent && isSpent ? "bg-rose" : isSpent ? "bg-sky" : "bg-ink-edge";
          return <span key={index} className={`h-4 flex-1 rounded-[1px] ${fill}`} />;
        })}
      </div>

      <p className={`numeric mt-2 text-xs ${overspent ? "text-rose" : "text-cream-muted"}`}>
        {overspent
          ? `${Math.abs(remaining)} ${unit} over budget`
          : `${remaining} ${unit} left`}
      </p>
    </div>
  );
}
