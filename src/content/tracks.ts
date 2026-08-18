import { algorithmsConcepts } from "@/content/concepts/algorithms";
import { machineLearningConcepts } from "@/content/concepts/machine-learning";
import { objectDesignConcepts } from "@/content/concepts/object-design";
import { systemsConcepts } from "@/content/concepts/systems";
import type { Concept, Track, TrackId } from "@/types/content";

export const concepts: Concept[] = [
  ...algorithmsConcepts,
  ...objectDesignConcepts,
  ...systemsConcepts,
  ...machineLearningConcepts,
];

export const tracks: Track[] = [
  {
    id: "algorithms",
    title: "Algorithms",
    tagline: "Count the work before you write the code",
    description:
      "Sorting, searching, and the cost model underneath them. You solve each one by hand under a budget first, so the complexity class arrives as something you felt rather than something you read.",
    sourceBook: "Introduction to Algorithms (CLRS), 4th edition",
    accent: "blue",
    conceptSlugs: algorithmsConcepts.map((concept) => concept.slug),
  },
  {
    id: "object-design",
    title: "Object design",
    tagline: "Design for the change you know is coming",
    description:
      "Coupling and cohesion measured as blast radius. A change request arrives, the affected classes light up, and you rearrange responsibilities until the damage fits in one file.",
    sourceBook: "Head First Object-Oriented Analysis and Design",
    accent: "rose",
    conceptSlugs: objectDesignConcepts.map((concept) => concept.slug),
  },
  {
    id: "systems",
    title: "Systems",
    tagline: "Find the wall before you buy hardware",
    description:
      "A deterministic traffic simulator with a fixed budget. Place caches, replicas, and queues, then watch a spike hit and see exactly which link in the chain gave way.",
    sourceBook: "Designing Data-Intensive Applications (DDIA), 2nd edition",
    accent: "umber",
    conceptSlugs: systemsConcepts.map((concept) => concept.slug),
  },
  {
    id: "machine-learning",
    title: "Machine learning",
    tagline: "Restriction is what buys generalisation",
    description:
      "Draw boundaries by hand, then let a model train on the same points. Overfitting stops being a warning and becomes a gap between two numbers you watched move.",
    sourceBook: "Understanding Machine Learning: From Theory to Algorithms",
    accent: "peach",
    conceptSlugs: machineLearningConcepts.map((concept) => concept.slug),
  },
];

export function getTrack(trackId: string): Track | undefined {
  return tracks.find((track) => track.id === trackId);
}

export function getConcept(slug: string): Concept | undefined {
  return concepts.find((concept) => concept.slug === slug);
}

export function getConceptsForTrack(trackId: TrackId): Concept[] {
  return concepts.filter((concept) => concept.trackId === trackId);
}

export function countPhases(concept: Concept): number {
  return concept.phases.length;
}
