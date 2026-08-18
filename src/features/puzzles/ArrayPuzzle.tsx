"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BudgetMeter } from "@/components/ui/BudgetMeter";
import {
  type ArrayLevel,
  type ArrayPuzzleState,
  applyOperation,
  createInitialState,
  evaluate,
} from "@/engines/arrayops/engine";

interface ArrayPuzzleProps {
  level: ArrayLevel;
  onResult: (cleared: boolean, score: number) => void;
}

const verdictWords = { less: "is smaller than", equal: "equals", greater: "is bigger than" } as const;

export function ArrayPuzzle({ level, onResult }: ArrayPuzzleProps) {
  const [state, setState] = useState<ArrayPuzzleState>(() => createInitialState(level));
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const verdict = useMemo(() => evaluate(state, level), [state, level]);
  const canSwap = level.allowedOperations.includes("swap");
  const isSearch = level.goal === "findTarget";

  function reset() {
    setState(createInitialState(level));
    setSelected(null);
    setMessage(null);
    setChecked(false);
  }

  function handleCellClick(index: number) {
    setChecked(false);

    if (isSearch) {
      const next = applyOperation(state, { kind: "probe", index }, level);
      setState(next);
      setMessage(
        next.foundIndex === index
          ? `Found ${level.target} at position ${index}.`
          : `Position ${index} holds ${next.values[index]}.`,
      );
      return;
    }

    if (selected === null) {
      setSelected(index);
      setMessage(`Position ${index} selected. Pick a second position to compare or swap.`);
      return;
    }

    if (selected === index) {
      setSelected(null);
      setMessage(null);
      return;
    }

    const next = applyOperation(state, { kind: "compare", left: selected, right: index }, level);
    setState(next);
    setMessage(
      `Position ${selected} ${verdictWords[next.lastComparison!.verdict]} position ${index}.`,
    );
    setSelected(index);
  }

  function handleSwap() {
    if (selected === null || state.lastComparison === null) return;
    const { left, right } = state.lastComparison;
    setState(applyOperation(state, { kind: "swap", left, right }, level));
    setMessage(`Swapped positions ${left} and ${right}.`);
    setSelected(null);
    setChecked(false);
  }

  function handleCheck() {
    setChecked(true);
    onResult(verdict.cleared, verdict.cost);
  }

  return (
    <div className="space-y-4">
      <BudgetMeter label="Operations" spent={verdict.cost} budget={verdict.budget} unit="ops" />

      {isSearch ? (
        <p className="numeric text-sm text-sky">Looking for {level.target}</p>
      ) : null}

      <ul className="flex flex-wrap gap-2" aria-label="Puzzle cells">
        {state.values.map((value, index) => {
          const isRevealed = state.revealedIndexes.includes(index);
          const isSelected = selected === index;
          const isFound = state.foundIndex === index;
          const border = isFound ? "border-sky" : isSelected ? "border-rose" : "border-ink-edge";
          const fill = isRevealed ? "bg-ink text-cream" : "bg-ink-deep text-cream-muted";

          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => handleCellClick(index)}
                className={`numeric flex h-16 w-16 flex-col items-center justify-center rounded-panel border-2 transition-colors hover:border-sky ${border} ${fill}`}
                aria-label={
                  isRevealed ? `Position ${index}, value ${value}` : `Position ${index}, hidden`
                }
              >
                <span className="text-lg">{isRevealed ? value : "?"}</span>
                <span className="text-[0.625rem] text-cream-muted">{index}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="min-h-[1.5rem] text-sm text-cream-muted" aria-live="polite">
        {message ?? "Pick a cell to begin."}
      </p>

      <div className="flex flex-wrap gap-2">
        {canSwap ? (
          <Button variant="secondary" onClick={handleSwap} disabled={state.lastComparison === null}>
            Swap the last compared pair
          </Button>
        ) : null}
        <Button onClick={handleCheck}>Check my answer</Button>
        <Button variant="ghost" onClick={reset}>
          Start over
        </Button>
      </div>

      {checked ? (
        <p
          className={`rounded-panel border px-4 py-3 text-sm ${
            verdict.cleared ? "border-sky text-sky" : "border-rose text-rose"
          }`}
          role="status"
        >
          {verdict.cleared
            ? `Cleared in ${verdict.cost} operations.`
            : verdict.goalReached
              ? `Goal reached, but it took ${verdict.cost} operations against a budget of ${verdict.budget}. There is a cheaper route.`
              : "Not there yet. The goal has not been reached."}
        </p>
      ) : null}
    </div>
  );
}
