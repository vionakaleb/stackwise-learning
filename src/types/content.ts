import type { ArrayLevel } from "@/engines/arrayops/engine";
import type { BlueprintLevel } from "@/engines/blueprint/engine";
import type { BoundaryLevel } from "@/engines/boundary/engine";
import type { TrafficLevel } from "@/engines/traffic/engine";

export type TrackId = "algorithms" | "systems" | "object-design" | "machine-learning";

export interface Track {
  id: TrackId;
  title: string;
  tagline: string;
  description: string;
  sourceBook: string;
  accent: "blue" | "peach" | "rose" | "umber";
  conceptSlugs: string[];
}

export type Confidence = "verified" | "widely-documented" | "interpretation";

export interface PredictPhase {
  kind: "predict";
  prompt: string;
  options: string[];
  correctIndex: number;
  afterword: string;
}

export interface PlayPhase {
  kind: "play";
  brief: string;
  puzzleId: string;
}

export interface RevealPhase {
  kind: "reveal";
  heading: string;
  body: string[];
}

export interface ImplementPhase {
  kind: "implement";
  heading: string;
  language: string;
  code: string;
  notes: string[];
}

export interface CasePhase {
  kind: "case";
  heading: string;
  body: string[];
  confidence: Confidence;
  sourceNote: string;
}

export type LessonPhase = PredictPhase | PlayPhase | RevealPhase | ImplementPhase | CasePhase;

export interface Concept {
  slug: string;
  trackId: TrackId;
  title: string;
  blurb: string;
  syllabusRef: string;
  minutes: number;
  prerequisites: string[];
  phases: LessonPhase[];
}

export type PuzzleDefinition =
  | { engine: "arrayops"; level: ArrayLevel }
  | { engine: "blueprint"; level: BlueprintLevel }
  | { engine: "traffic"; level: TrafficLevel }
  | { engine: "boundary"; level: BoundaryLevel; mode: "line" | "neighbours" };
