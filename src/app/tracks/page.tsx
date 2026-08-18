import Link from "next/link";
import type { Metadata } from "next";
import { concepts, tracks } from "@/content/tracks";
import { accentClasses, plural } from "@/lib/formatting";

export const metadata: Metadata = {
  title: "Tracks — StackWise",
  description: "Four tracks covering algorithms, object design, distributed systems, and machine learning.",
};

export default function TracksPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-sky">Pick a starting point</p>
        <h1 className="mt-3 text-4xl">Tracks</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-cream-muted">
          Algorithms is the natural first track because the cost model it teaches shows up in the other
          three. Nothing is locked at the track level, only concepts inside a track have prerequisites.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {tracks.map((track) => {
          const accent = accentClasses(track.accent);
          const trackConcepts = concepts.filter((concept) => concept.trackId === track.id);
          const totalMinutes = trackConcepts.reduce((sum, concept) => sum + concept.minutes, 0);

          return (
            <Link
              key={track.id}
              href={`/tracks/${track.id}`}
              className="rounded-panel border border-ink-edge bg-ink p-5 transition-colors hover:border-cream"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
                <span className={`eyebrow ${accent.text}`}>{track.tagline}</span>
              </div>
              <h2 className="mt-3 text-2xl">{track.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-cream-muted">{track.description}</p>
              <p className="numeric mt-4 text-xs text-cream-muted">
                {plural(trackConcepts.length, "concept")} · about {totalMinutes} minutes
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
