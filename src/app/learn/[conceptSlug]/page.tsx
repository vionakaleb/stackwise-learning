import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { concepts, getConcept, getTrack } from "@/content/tracks";
import { ConceptRunner } from "@/features/concept/ConceptRunner";

interface ConceptPageProps {
  params: Promise<{ conceptSlug: string }>;
}

export function generateStaticParams() {
  return concepts.map((concept) => ({ conceptSlug: concept.slug }));
}

export async function generateMetadata({ params }: ConceptPageProps): Promise<Metadata> {
  const { conceptSlug } = await params;
  const concept = getConcept(conceptSlug);
  if (!concept) return { title: "Concept not found - StackWise" };
  return { title: `${concept.title} - StackWise`, description: concept.blurb };
}

export default async function ConceptPage({ params }: ConceptPageProps) {
  const { conceptSlug } = await params;
  const concept = getConcept(conceptSlug);
  if (!concept) notFound();

  const track = getTrack(concept.trackId);

  return (
    <div className="space-y-8">
      <header>
        <Link
          href={`/tracks/${concept.trackId}`}
          className="eyebrow text-cream-muted transition-colors hover:text-cream"
        >
          Back to {track?.title ?? "track"}
        </Link>
        <h1 className="mt-4 text-4xl">{concept.title}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-cream-muted">{concept.blurb}</p>
        <p className="numeric mt-3 text-xs text-cream-muted">
          about {concept.minutes} minutes · topic follows {concept.syllabusRef}
        </p>
      </header>

      <ConceptRunner concept={concept} />
    </div>
  );
}
