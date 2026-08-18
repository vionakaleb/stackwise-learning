"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PuzzleResult {
  cleared: boolean;
  attempts: number;
  bestScore: number | null;
}

export interface PredictionResult {
  chosenIndex: number;
  wasCorrect: boolean;
}

interface ProgressState {
  furthestPhaseByConcept: Record<string, number>;
  completedConcepts: string[];
  puzzleResults: Record<string, PuzzleResult>;
  predictions: Record<string, PredictionResult>;
  recordPhaseReached: (conceptSlug: string, phaseIndex: number) => void;
  markConceptComplete: (conceptSlug: string) => void;
  recordPrediction: (conceptSlug: string, chosenIndex: number, wasCorrect: boolean) => void;
  recordPuzzleAttempt: (puzzleId: string, cleared: boolean, score: number | null) => void;
  resetEverything: () => void;
}

const emptyProgress = {
  furthestPhaseByConcept: {} as Record<string, number>,
  completedConcepts: [] as string[],
  puzzleResults: {} as Record<string, PuzzleResult>,
  predictions: {} as Record<string, PredictionResult>,
};

function betterScore(previous: number | null, next: number | null): number | null {
  if (next === null) return previous;
  if (previous === null) return next;
  return Math.min(previous, next);
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      ...emptyProgress,

      recordPhaseReached: (conceptSlug, phaseIndex) =>
        set((state) => ({
          furthestPhaseByConcept: {
            ...state.furthestPhaseByConcept,
            [conceptSlug]: Math.max(state.furthestPhaseByConcept[conceptSlug] ?? 0, phaseIndex),
          },
        })),

      markConceptComplete: (conceptSlug) =>
        set((state) =>
          state.completedConcepts.includes(conceptSlug)
            ? state
            : { completedConcepts: [...state.completedConcepts, conceptSlug] },
        ),

      recordPrediction: (conceptSlug, chosenIndex, wasCorrect) =>
        set((state) =>
          state.predictions[conceptSlug]
            ? state
            : {
                predictions: {
                  ...state.predictions,
                  [conceptSlug]: { chosenIndex, wasCorrect },
                },
              },
        ),

      recordPuzzleAttempt: (puzzleId, cleared, score) =>
        set((state) => {
          const previous = state.puzzleResults[puzzleId];
          return {
            puzzleResults: {
              ...state.puzzleResults,
              [puzzleId]: {
                cleared: previous?.cleared || cleared,
                attempts: (previous?.attempts ?? 0) + 1,
                bestScore: cleared ? betterScore(previous?.bestScore ?? null, score) : (previous?.bestScore ?? null),
              },
            },
          };
        }),

      resetEverything: () => set({ ...emptyProgress }),
    }),
    { name: "stackwise-progress", version: 1 },
  ),
);

export function calibration(predictions: Record<string, PredictionResult>) {
  const entries = Object.values(predictions);
  const correct = entries.filter((entry) => entry.wasCorrect).length;
  return {
    answered: entries.length,
    correct,
    rate: entries.length === 0 ? null : correct / entries.length,
  };
}
