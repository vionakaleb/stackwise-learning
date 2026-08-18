import Link from "next/link";
import { concepts, tracks } from "@/content/tracks";
import { accentClasses, plural } from "@/lib/formatting";

const loop = [
  { label: "Predict", detail: "Commit to a guess before anything moves." },
  { label: "Play", detail: "Solve it by hand under a budget. No code yet." },
  { label: "Reveal", detail: "See what the budget was measuring all along." },
  { label: "Implement", detail: "Now write it, once you know why it works." },
  { label: "In the wild", detail: "Where this shows up, and what it cost when it broke." },
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      <section>
        <p className="eyebrow text-sky">Guess first. Then find out.</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] md:text-6xl">
          Most courses explain the answer, then ask you to apply it. This one makes you guess wrong first.
        </h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-cream-muted">
          Every lesson opens with a prediction you have to commit to. Then you solve the thing by hand
          under a budget, before any code appears. The explanation arrives after you already felt the
          shape of the problem, which is the only point at which it sticks.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/tracks"
            className="rounded-panel bg-cream px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-rose"
          >
            Start with algorithms
          </Link>
          <Link
            href="/progress"
            className="rounded-panel border border-sky px-5 py-3 text-sm font-semibold text-sky transition-colors hover:bg-sky hover:text-ink"
          >
            See your calibration
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl">Every concept runs the same five phases</h2>
        <ol className="mt-6 grid gap-px overflow-hidden rounded-panel border border-ink-edge bg-ink-edge md:grid-cols-5">
          {loop.map((step, index) => (
            <li key={step.label} className="bg-ink p-4">
              <span className="numeric text-xs text-sky">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-base">{step.label}</h3>
              <p className="mt-2 text-xs leading-relaxed text-cream-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-2xl">Four tracks</h2>
        <p className="mt-2 max-w-2xl text-sm text-cream-muted">
          Each track has its own puzzle mechanic, built so the mechanic is the concept rather than a
          wrapper around it.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {tracks.map((track) => {
            const accent = accentClasses(track.accent);
            const trackConcepts = concepts.filter((concept) => concept.trackId === track.id);

            return (
              <Link
                key={track.id}
                href={`/tracks/${track.id}`}
                className="group rounded-panel border border-ink-edge bg-ink p-5 transition-colors hover:border-cream"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
                  <span className={`eyebrow ${accent.text}`}>{track.tagline}</span>
                </div>
                <h3 className="mt-3 text-xl">{track.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-muted">{track.description}</p>
                <p className="numeric mt-4 text-xs text-cream-muted">
                  {plural(trackConcepts.length, "concept")} · from {track.sourceBook}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
