"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { concepts, tracks } from "@/content/tracks";
import { calibration, useProgressStore } from "@/features/progress/store";
import { useStoreHydrated } from "@/features/progress/useStoreHydrated";
import { accentClasses, percent } from "@/lib/formatting";

export function ProgressBoard() {
  const completedConcepts = useProgressStore((state) => state.completedConcepts);
  const predictions = useProgressStore((state) => state.predictions);
  const puzzleResults = useProgressStore((state) => state.puzzleResults);
  const resetEverything = useProgressStore((state) => state.resetEverything);

  const hydrated = useStoreHydrated();

  if (!hydrated) {
    return <p className="text-sm text-cream-muted">Reading your progress from this browser...</p>;
  }

  const calibrationScore = calibration(predictions);
  const clearedPuzzles = Object.values(puzzleResults).filter((result) => result.cleared).length;
  const totalAttempts = Object.values(puzzleResults).reduce((sum, result) => sum + result.attempts, 0);

  return (
    <div className="space-y-10">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-panel border border-ink-edge bg-ink p-5">
          <p className="eyebrow text-cream-muted">Calibration</p>
          <p className="numeric mt-2 text-4xl text-sky">
            {calibrationScore.rate === null ? "-" : percent(calibrationScore.rate)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-cream-muted">
            {calibrationScore.correct} of {calibrationScore.answered} predictions called right. This is
            the number worth watching. It measures whether you can predict behaviour, not whether you
            recognise an answer.
          </p>
        </article>

        <article className="rounded-panel border border-ink-edge bg-ink p-5">
          <p className="eyebrow text-cream-muted">Puzzles cleared</p>
          <p className="numeric mt-2 text-4xl text-cream">{clearedPuzzles}</p>
          <p className="mt-2 text-xs leading-relaxed text-cream-muted">
            Across {totalAttempts} attempts. Retrying a puzzle costs nothing and does not count against
            you.
          </p>
        </article>

        <article className="rounded-panel border border-ink-edge bg-ink p-5">
          <p className="eyebrow text-cream-muted">Concepts finished</p>
          <p className="numeric mt-2 text-4xl text-cream">
            {completedConcepts.length}
            <span className="text-lg text-cream-muted"> / {concepts.length}</span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-cream-muted">
            A concept counts as finished once you reach the end of its five phases.
          </p>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">By track</h2>
        {tracks.map((track) => {
          const trackConcepts = concepts.filter((concept) => concept.trackId === track.id);
          const done = trackConcepts.filter((concept) => completedConcepts.includes(concept.slug));
          const accent = accentClasses(track.accent);

          return (
            <article key={track.id} className="rounded-panel border border-ink-edge bg-ink p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg">
                  <Link href={`/tracks/${track.id}`} className="transition-colors hover:text-sky">
                    {track.title}
                  </Link>
                </h3>
                <span className="numeric text-sm text-cream-muted">
                  {done.length} / {trackConcepts.length}
                </span>
              </div>
              <ul className="mt-3 space-y-1">
                {trackConcepts.map((concept) => {
                  const isDone = completedConcepts.includes(concept.slug);
                  const prediction = predictions[concept.slug];
                  return (
                    <li key={concept.slug} className="flex items-center gap-3 text-sm">
                      <span className={`h-2 w-2 rounded-full ${isDone ? accent.dot : "bg-ink-edge"}`} />
                      <span className={isDone ? "text-cream" : "text-cream-muted"}>{concept.title}</span>
                      {prediction ? (
                        <span className={`eyebrow ${prediction.wasCorrect ? "text-sky" : "text-rose"}`}>
                          {prediction.wasCorrect ? "predicted right" : "predicted wrong"}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="rounded-panel border border-ink-edge bg-ink-deep p-5">
        <h2 className="text-lg">Clear everything</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream-muted">
          Progress lives in this browser only. Clearing it here or clearing your browser data has the
          same effect, and there is no way to get it back.
        </p>
        <div className="mt-4">
          <Button variant="secondary" onClick={resetEverything}>
            Reset my progress
          </Button>
        </div>
      </section>
    </div>
  );
}
