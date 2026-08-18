"use client";

import Link from "next/link";
import { getConcept } from "@/content/tracks";
import { useProgressStore } from "@/features/progress/store";
import { useStoreHydrated } from "@/features/progress/useStoreHydrated";
import type { Concept } from "@/types/content";

function unmetPrerequisites(concept: Concept, completed: string[]): string[] {
  return concept.prerequisites.filter((slug) => !completed.includes(slug));
}

export function ConceptList({ concepts }: { concepts: Concept[] }) {
  const completedConcepts = useProgressStore((state) => state.completedConcepts);
  const hydrated = useStoreHydrated();

  return (
    <ol className="space-y-3">
      {concepts.map((concept, index) => {
        const missing = hydrated ? unmetPrerequisites(concept, completedConcepts) : [];
        const isLocked = missing.length > 0;
        const isDone = hydrated && completedConcepts.includes(concept.slug);

        const body = (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="numeric text-xs text-sky">{String(index + 1).padStart(2, "0")}</span>
              {isDone ? <span className="eyebrow text-sky">done</span> : null}
              {isLocked ? <span className="eyebrow text-cream-muted">locked</span> : null}
            </div>
            <h3 className="mt-2 text-xl">{concept.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-cream-muted">{concept.blurb}</p>
            <p className="numeric mt-3 text-xs text-cream-muted">
              {concept.phases.length} phases · about {concept.minutes} minutes
            </p>
            {isLocked ? (
              <p className="mt-3 text-xs text-rose">
                Finish {missing.map((slug) => getConcept(slug)?.title ?? slug).join(", ")} first. The
                puzzle here builds on it.
              </p>
            ) : null}
          </>
        );

        const shell = "block rounded-panel border p-5 transition-colors";

        return (
          <li key={concept.slug}>
            {isLocked ? (
              <div className={`${shell} border-ink-edge bg-ink opacity-60`} aria-disabled="true">
                {body}
              </div>
            ) : (
              <Link
                href={`/learn/${concept.slug}`}
                className={`${shell} border-ink-edge bg-ink hover:border-cream`}
              >
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
