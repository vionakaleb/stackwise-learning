import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getConceptsForTrack, getTrack, tracks } from "@/content/tracks";
import { ConceptList } from "@/features/concept/ConceptList";
import { accentClasses } from "@/lib/formatting";
import type { TrackId } from "@/types/content";

interface TrackPageProps {
  params: Promise<{ trackId: string }>;
}

export function generateStaticParams() {
  return tracks.map((track) => ({ trackId: track.id }));
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { trackId } = await params;
  const track = getTrack(trackId);
  if (!track) return { title: "Track not found — StackWise" };
  return { title: `${track.title} — StackWise`, description: track.description };
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { trackId } = await params;
  const track = getTrack(trackId);
  if (!track) notFound();

  const trackConcepts = getConceptsForTrack(track.id as TrackId);
  const accent = accentClasses(track.accent);

  return (
    <div className="space-y-8">
      <header>
        <Link href="/tracks" className="eyebrow text-cream-muted transition-colors hover:text-cream">
          All tracks
        </Link>
        <h1 className="mt-4 text-4xl">{track.title}</h1>
        <p className={`eyebrow mt-2 ${accent.text}`}>{track.tagline}</p>
        <p className="mt-4 max-w-2xl leading-relaxed text-cream-muted">{track.description}</p>
        <p className="numeric mt-4 text-xs text-cream-muted">
          Topics follow {track.sourceBook}. Explanations and puzzles are written for StackWise.
        </p>
      </header>

      <ConceptList concepts={trackConcepts} />
    </div>
  );
}
