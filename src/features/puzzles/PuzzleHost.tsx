"use client";

import { ArrayPuzzle } from "@/features/puzzles/ArrayPuzzle";
import { BlueprintPuzzle } from "@/features/puzzles/BlueprintPuzzle";
import { BoundaryPuzzle } from "@/features/puzzles/BoundaryPuzzle";
import { TrafficPuzzle } from "@/features/puzzles/TrafficPuzzle";
import { getPuzzle } from "@/content/puzzles";

interface PuzzleHostProps {
  puzzleId: string;
  onResult: (cleared: boolean, score: number) => void;
}

export function PuzzleHost({ puzzleId, onResult }: PuzzleHostProps) {
  const puzzle = getPuzzle(puzzleId);

  switch (puzzle.engine) {
    case "arrayops":
      return <ArrayPuzzle level={puzzle.level} onResult={onResult} />;
    case "blueprint":
      return <BlueprintPuzzle level={puzzle.level} onResult={onResult} />;
    case "traffic":
      return <TrafficPuzzle level={puzzle.level} onResult={onResult} />;
    case "boundary":
      return <BoundaryPuzzle level={puzzle.level} mode={puzzle.mode} onResult={onResult} />;
  }
}
