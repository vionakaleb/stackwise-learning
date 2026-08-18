"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ConfidenceTag } from "@/components/ui/ConfidenceTag";
import { PuzzleHost } from "@/features/puzzles/PuzzleHost";
import type { LessonPhase } from "@/types/content";

interface PhaseViewProps {
  phase: LessonPhase;
  conceptSlug: string;
  onPrediction: (chosenIndex: number, wasCorrect: boolean) => void;
  onPuzzleResult: (puzzleId: string, cleared: boolean, score: number) => void;
}

export function PhaseView({ phase, conceptSlug, onPrediction, onPuzzleResult }: PhaseViewProps) {
  switch (phase.kind) {
    case "predict":
      return (
        <PredictView
          key={conceptSlug}
          prompt={phase.prompt}
          options={phase.options}
          correctIndex={phase.correctIndex}
          afterword={phase.afterword}
          onPrediction={onPrediction}
        />
      );

    case "play":
      return (
        <div className="space-y-4">
          <p className="text-cream-muted">{phase.brief}</p>
          <PuzzleHost
            puzzleId={phase.puzzleId}
            onResult={(cleared, score) => onPuzzleResult(phase.puzzleId, cleared, score)}
          />
        </div>
      );

    case "reveal":
      return (
        <article className="space-y-4">
          <h3 className="text-2xl">{phase.heading}</h3>
          {phase.body.map((paragraph, index) => (
            <p key={index} className="leading-relaxed text-cream-muted">
              {paragraph}
            </p>
          ))}
        </article>
      );

    case "implement":
      return (
        <div className="space-y-4">
          <h3 className="text-2xl">{phase.heading}</h3>
          <CodeBlock language={phase.language} code={phase.code} />
          <ul className="space-y-2">
            {phase.notes.map((note, index) => (
              <li key={index} className="border-l-2 border-sky pl-3 text-sm text-cream-muted">
                {note}
              </li>
            ))}
          </ul>
        </div>
      );

    case "case":
      return (
        <article className="space-y-4">
          <h3 className="text-2xl">{phase.heading}</h3>
          {phase.body.map((paragraph, index) => (
            <p key={index} className="leading-relaxed text-cream-muted">
              {paragraph}
            </p>
          ))}
          <div className="space-y-2 rounded-panel border border-ink-edge bg-ink-deep p-4">
            <ConfidenceTag confidence={phase.confidence} />
            <p className="text-xs leading-relaxed text-cream-muted">{phase.sourceNote}</p>
          </div>
        </article>
      );
  }
}

interface PredictViewProps {
  prompt: string;
  options: string[];
  correctIndex: number;
  afterword: string;
  onPrediction: (chosenIndex: number, wasCorrect: boolean) => void;
}

function PredictView({ prompt, options, correctIndex, afterword, onPrediction }: PredictViewProps) {
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);

  function choose(index: number) {
    if (chosenIndex !== null) return;
    setChosenIndex(index);
    onPrediction(index, index === correctIndex);
  }

  return (
    <div className="space-y-4">
      <p className="eyebrow text-sky">Commit before you look</p>
      <h3 className="text-2xl">{prompt}</h3>

      <ul className="space-y-2">
        {options.map((option, index) => {
          const isChosen = chosenIndex === index;
          const isAnswer = chosenIndex !== null && index === correctIndex;
          const border = isAnswer ? "border-sky" : isChosen ? "border-rose" : "border-ink-edge";

          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => choose(index)}
                disabled={chosenIndex !== null}
                aria-pressed={isChosen}
                className={`w-full rounded-panel border-2 px-4 py-3 text-left transition-colors ${border} ${
                  chosenIndex === null ? "hover:border-sky" : "cursor-default"
                }`}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {chosenIndex !== null ? (
        <div className="rounded-panel border border-ink-edge bg-ink-deep p-4" role="status">
          <p className={`eyebrow ${chosenIndex === correctIndex ? "text-sky" : "text-rose"}`}>
            {chosenIndex === correctIndex ? "Called it" : "Not quite"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cream-muted">{afterword}</p>
        </div>
      ) : (
        <p className="text-sm text-cream-muted">
          Pick one. Being wrong here is useful, it is the whole point of guessing first.
        </p>
      )}
    </div>
  );
}
