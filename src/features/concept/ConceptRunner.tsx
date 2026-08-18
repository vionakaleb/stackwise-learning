"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PhaseView } from "@/features/concept/PhaseView";
import { useProgressStore } from "@/features/progress/store";
import type { Concept } from "@/types/content";

const phaseLabels: Record<Concept["phases"][number]["kind"], string> = {
  predict: "Predict",
  play: "Play",
  reveal: "Reveal",
  implement: "Implement",
  case: "In the wild",
};

export function ConceptRunner({ concept }: { concept: Concept }) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const recordPhaseReached = useProgressStore((state) => state.recordPhaseReached);
  const markConceptComplete = useProgressStore((state) => state.markConceptComplete);
  const recordPrediction = useProgressStore((state) => state.recordPrediction);
  const recordPuzzleAttempt = useProgressStore((state) => state.recordPuzzleAttempt);

  const phase = concept.phases[phaseIndex];
  const isLastPhase = phaseIndex === concept.phases.length - 1;

  function goToPhase(nextIndex: number) {
    setPhaseIndex(nextIndex);
    recordPhaseReached(concept.slug, nextIndex);
  }

  function finish() {
    markConceptComplete(concept.slug);
    recordPhaseReached(concept.slug, concept.phases.length - 1);
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2" aria-label="Lesson phases">
        {concept.phases.map((item, index) => {
          const isCurrent = index === phaseIndex;
          const isVisited = index < phaseIndex;
          const style = isCurrent
            ? "border-cream bg-cream text-ink"
            : isVisited
              ? "border-sky text-sky"
              : "border-ink-edge text-cream-muted";

          return (
            <li key={`${item.kind}-${index}`}>
              <button
                type="button"
                onClick={() => goToPhase(index)}
                aria-current={isCurrent ? "step" : undefined}
                className={`eyebrow rounded-panel border px-3 py-2 transition-colors ${style}`}
              >
                {index + 1}. {phaseLabels[item.kind]}
              </button>
            </li>
          );
        })}
      </ol>

      <section className="rounded-panel border border-ink-edge bg-ink p-5 md:p-8">
        <PhaseView
          key={phaseIndex}
          phase={phase}
          conceptSlug={concept.slug}
          onPrediction={(chosenIndex, wasCorrect) =>
            recordPrediction(concept.slug, chosenIndex, wasCorrect)
          }
          onPuzzleResult={(puzzleId, cleared, score) => recordPuzzleAttempt(puzzleId, cleared, score)}
        />
      </section>

      <nav className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => goToPhase(phaseIndex - 1)}
          disabled={phaseIndex === 0}
        >
          Back
        </Button>

        {isLastPhase ? (
          <Link
            href={`/tracks/${concept.trackId}`}
            onClick={finish}
            className="rounded-panel bg-cream px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-rose"
          >
            Finish this concept
          </Link>
        ) : (
          <Button onClick={() => goToPhase(phaseIndex + 1)}>Next</Button>
        )}
      </nav>
    </div>
  );
}
