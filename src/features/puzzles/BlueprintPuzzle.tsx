"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BudgetMeter } from "@/components/ui/BudgetMeter";
import {
  type BlueprintLevel,
  type BlueprintSystem,
  createInitialSystem,
  evaluate,
  moveResponsibility,
} from "@/engines/blueprint/engine";

interface BlueprintPuzzleProps {
  level: BlueprintLevel;
  onResult: (cleared: boolean, score: number) => void;
}

function withSpareBlueprints(system: BlueprintSystem, level: BlueprintLevel): BlueprintSystem {
  const spares = level.spareBlueprintNames.map((name) => ({
    id: name.toLowerCase(),
    name,
    responsibilityIds: [] as string[],
  }));
  return { ...system, blueprints: [...system.blueprints, ...spares] };
}

export function BlueprintPuzzle({ level, onResult }: BlueprintPuzzleProps) {
  const [system, setSystem] = useState<BlueprintSystem>(() =>
    withSpareBlueprints(createInitialSystem(level), level),
  );
  const [activeChangeId, setActiveChangeId] = useState(level.changeRequests[0].id);
  const [checked, setChecked] = useState(false);

  const verdict = useMemo(() => evaluate(system, level), [system, level]);
  const activeRadius = verdict.radii.find((radius) => radius.changeRequestId === activeChangeId)!;

  const labelFor = (responsibilityId: string) =>
    level.responsibilities.find((item) => item.id === responsibilityId)?.label ?? responsibilityId;

  function handleMove(responsibilityId: string, destinationId: string) {
    setSystem(moveResponsibility(system, responsibilityId, destinationId));
    setChecked(false);
  }

  function handleCheck() {
    setChecked(true);
    onResult(verdict.cleared, verdict.worstRadius);
  }

  return (
    <div className="space-y-4">
      <BudgetMeter
        label="Worst blast radius"
        spent={verdict.worstRadius}
        budget={level.targetBlastRadius}
        unit="blueprints"
      />

      <div>
        <p className="eyebrow mb-2 text-cream-muted">Change request to preview</p>
        <div className="flex flex-wrap gap-2">
          {level.changeRequests.map((changeRequest) => {
            const isActive = changeRequest.id === activeChangeId;
            return (
              <button
                key={changeRequest.id}
                type="button"
                onClick={() => setActiveChangeId(changeRequest.id)}
                aria-pressed={isActive}
                className={`rounded-panel border px-3 py-2 text-sm transition-colors ${
                  isActive ? "border-rose bg-rose text-ink" : "border-ink-edge text-cream-muted hover:border-rose"
                }`}
              >
                {changeRequest.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {system.blueprints.map((blueprint) => {
          const isDirect = activeRadius.directIds.includes(blueprint.id);
          const isRipple = activeRadius.rippleIds.includes(blueprint.id);
          const border = isDirect ? "border-rose" : isRipple ? "border-umber-light" : "border-ink-edge";

          return (
            <section key={blueprint.id} className={`rounded-panel border-2 bg-ink p-3 ${border}`}>
              <header className="mb-2 flex items-center justify-between">
                <h4 className="text-base">{blueprint.name}</h4>
                {isDirect ? <span className="eyebrow text-rose">edits here</span> : null}
                {isRipple ? <span className="eyebrow text-umber-light">retest</span> : null}
              </header>

              {blueprint.responsibilityIds.length === 0 ? (
                <p className="text-xs text-cream-muted">Empty. Move something in or this counts against you.</p>
              ) : (
                <ul className="space-y-2">
                  {blueprint.responsibilityIds.map((responsibilityId) => (
                    <li key={responsibilityId} className="rounded-panel bg-ink-deep px-2 py-2">
                      <p className="text-sm">{labelFor(responsibilityId)}</p>
                      <label className="mt-1 flex items-center gap-2 text-xs text-cream-muted">
                        <span>Move to</span>
                        <select
                          value={blueprint.id}
                          onChange={(event) => handleMove(responsibilityId, event.target.value)}
                          className="numeric rounded-panel border border-ink-edge bg-ink px-2 py-1 text-cream"
                        >
                          {system.blueprints.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <p className="text-sm text-cream-muted" aria-live="polite">
        This change touches {activeRadius.directIds.length} blueprint(s) directly and drags{" "}
        {activeRadius.rippleIds.length} more into retesting.
      </p>

      <Button onClick={handleCheck}>Check my design</Button>

      {checked ? (
        <p
          className={`rounded-panel border px-4 py-3 text-sm ${
            verdict.cleared ? "border-sky text-sky" : "border-rose text-rose"
          }`}
          role="status"
        >
          {verdict.cleared
            ? `Cleared. The worst change now touches ${verdict.worstRadius} blueprint.`
            : verdict.emptyBlueprintCount > 0
              ? "An empty blueprint is not a design win. Give every blueprint a job or remove the responsibility from it."
              : `Worst case still touches ${verdict.worstRadius} blueprints. Target is ${level.targetBlastRadius}.`}
        </p>
      ) : null}
    </div>
  );
}
