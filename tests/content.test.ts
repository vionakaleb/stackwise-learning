import { describe, expect, it } from "vitest";
import { concepts, getConcept, tracks } from "@/content/tracks";
import { puzzles } from "@/content/puzzles";
import {
  type ArrayOperation,
  evaluate as evaluateArray,
  replayOperations,
} from "@/engines/arrayops/engine";
import {
  type ComponentKind,
  type Placement,
  evaluate as evaluateTraffic,
} from "@/engines/traffic/engine";
import {
  evaluateBoundary,
  evaluateNeighbours,
  trainLogisticRegression,
} from "@/engines/boundary/engine";
import { createInitialSystem, evaluate as evaluateBlueprint, moveResponsibility } from "@/engines/blueprint/engine";

function everyPlacement(kinds: ComponentKind[], caps: number[]): Placement[] {
  const results: Placement[] = [];
  const walk = (index: number, current: Placement) => {
    if (index === kinds.length) {
      results.push({ ...current });
      return;
    }
    for (let units = 0; units <= caps[index]; units += 1) {
      walk(index + 1, { ...current, [kinds[index]]: units });
    }
  };
  walk(0, { appServer: 0, cache: 0, readReplica: 0, queue: 0 });
  return results;
}

describe("content wiring", () => {
  it("gives every concept a track that exists", () => {
    for (const concept of concepts) {
      expect(tracks.some((track) => track.id === concept.trackId)).toBe(true);
    }
  });

  it("points every prerequisite at a real concept", () => {
    for (const concept of concepts) {
      for (const slug of concept.prerequisites) {
        expect(getConcept(slug), `${concept.slug} requires missing ${slug}`).toBeDefined();
      }
    }
  });

  it("registers a puzzle for every play phase", () => {
    for (const concept of concepts) {
      for (const phase of concept.phases) {
        if (phase.kind === "play") {
          expect(puzzles[phase.puzzleId], `missing puzzle ${phase.puzzleId}`).toBeDefined();
        }
      }
    }
  });

  it("uses every registered puzzle exactly once", () => {
    const used = concepts.flatMap((concept) =>
      concept.phases.filter((phase) => phase.kind === "play").map((phase) => phase.puzzleId),
    );
    expect([...used].sort()).toEqual(Object.keys(puzzles).sort());
  });

  it("gives every concept a source note on each real-world case", () => {
    for (const concept of concepts) {
      for (const phase of concept.phases) {
        if (phase.kind === "case") {
          expect(phase.sourceNote.length).toBeGreaterThan(40);
        }
      }
    }
  });
});

describe("every puzzle is clearable and teaches its lesson", () => {
  it("insertion sort clears the budget, and a naive bubble pass does not", () => {
    const puzzle = puzzles["insertion-sort-budget"];
    if (puzzle.engine !== "arrayops") throw new Error("wrong engine");

    const values = [...puzzle.level.startValues];
    const operations: ArrayOperation[] = [];
    for (let boundary = 1; boundary < values.length; boundary += 1) {
      let position = boundary;
      while (position > 0) {
        operations.push({ kind: "compare", left: position - 1, right: position });
        if (values[position - 1] <= values[position]) break;
        operations.push({ kind: "swap", left: position - 1, right: position });
        [values[position - 1], values[position]] = [values[position], values[position - 1]];
        position -= 1;
      }
    }

    expect(evaluateArray(replayOperations(puzzle.level, operations), puzzle.level).cleared).toBe(true);
  });

  it("binary search needs the full budget, so halving is the only route", () => {
    const puzzle = puzzles["binary-search-budget"];
    if (puzzle.engine !== "arrayops") throw new Error("wrong engine");

    const values = puzzle.level.startValues;
    const operations: ArrayOperation[] = [];
    let low = 0;
    let high = values.length - 1;
    while (low <= high) {
      const middle = low + Math.floor((high - low) / 2);
      operations.push({ kind: "probe", index: middle });
      if (values[middle] === puzzle.level.target) break;
      if (values[middle] < puzzle.level.target!) low = middle + 1;
      else high = middle - 1;
    }

    const verdict = evaluateArray(replayOperations(puzzle.level, operations), puzzle.level);
    expect(verdict.cleared).toBe(true);
    expect(verdict.cost).toBe(puzzle.level.budget);
  });

  for (const puzzleId of ["notification-coupling", "open-closed-shipping"]) {
    it(`${puzzleId} has at least one arrangement that hits its target`, () => {
      const puzzle = puzzles[puzzleId];
      if (puzzle.engine !== "blueprint") throw new Error("wrong engine");

      const base = createInitialSystem(puzzle.level);
      const withSpares = {
        ...base,
        blueprints: [
          ...base.blueprints,
          ...puzzle.level.spareBlueprintNames.map((name) => ({
            id: name.toLowerCase(),
            name,
            responsibilityIds: [] as string[],
          })),
        ],
      };

      const blueprintIds = withSpares.blueprints.map((blueprint) => blueprint.id);
      const responsibilityIds = puzzle.level.responsibilities.map((item) => item.id);
      let solutions = 0;

      const walk = (index: number, system: typeof withSpares) => {
        if (index === responsibilityIds.length) {
          if (evaluateBlueprint(system, puzzle.level).cleared) solutions += 1;
          return;
        }
        for (const blueprintId of blueprintIds) {
          walk(index + 1, moveResponsibility(system, responsibilityIds[index], blueprintId));
        }
      };
      walk(0, withSpares);

      expect(solutions, `${puzzleId} is unsolvable as configured`).toBeGreaterThan(0);
    });
  }

  it("notification-coupling cannot be cleared by dumping everything in one blueprint", () => {
    const puzzle = puzzles["notification-coupling"];
    if (puzzle.engine !== "blueprint") throw new Error("wrong engine");

    let system = createInitialSystem(puzzle.level);
    for (const responsibility of puzzle.level.responsibilities) {
      system = moveResponsibility(system, responsibility.id, "order");
    }

    const verdict = evaluateBlueprint(system, puzzle.level);
    expect(verdict.emptyBlueprintCount).toBeGreaterThan(0);
    expect(verdict.cleared).toBe(false);
  });

  it("read-heavy level rewards a cache and punishes stacking app servers", () => {
    const puzzle = puzzles["read-scaling-spike"];
    if (puzzle.engine !== "traffic") throw new Error("wrong engine");

    const kinds = puzzle.level.available.map((spec) => spec.kind);
    const caps = puzzle.level.available.map((spec) => spec.maxUnits);
    const winners = everyPlacement(kinds, caps).filter(
      (placement) => evaluateTraffic(placement, puzzle.level).cleared,
    );

    expect(winners.length).toBeGreaterThan(0);
    expect(winners.every((placement) => placement.cache > 0)).toBe(true);

    const appOnly = evaluateTraffic({ appServer: 4, cache: 0, readReplica: 0, queue: 0 }, puzzle.level);
    const baseline = evaluateTraffic(puzzle.level.baseline, puzzle.level);
    expect(appOnly.result.dropRate).toBeCloseTo(baseline.result.dropRate, 5);
  });

  it("write-heavy level is unmoved by read replicas", () => {
    const puzzle = puzzles["write-bottleneck"];
    if (puzzle.engine !== "traffic") throw new Error("wrong engine");

    const kinds = puzzle.level.available.map((spec) => spec.kind);
    const caps = puzzle.level.available.map((spec) => spec.maxUnits);
    const winners = everyPlacement(kinds, caps).filter(
      (placement) => evaluateTraffic(placement, puzzle.level).cleared,
    );

    expect(winners.length).toBeGreaterThan(0);
    expect(winners.every((placement) => placement.queue > 0)).toBe(true);

    const withoutReplicas = evaluateTraffic({ appServer: 2, cache: 0, readReplica: 0, queue: 0 }, puzzle.level);
    const withReplicas = evaluateTraffic({ appServer: 2, cache: 0, readReplica: 2, queue: 0 }, puzzle.level);
    expect(withReplicas.result.dropRate).toBeCloseTo(withoutReplicas.result.dropRate, 5);
  });

  it("linear separator is separable by a trained model", () => {
    const puzzle = puzzles["linear-separator"];
    if (puzzle.engine !== "boundary") throw new Error("wrong engine");

    const trained = trainLogisticRegression(puzzle.level.trainingPoints);
    expect(evaluateBoundary(trained, puzzle.level).cleared).toBe(true);
  });

  it("neighbour level overfits at the low end and underfits at the high end", () => {
    const puzzle = puzzles["overfitting-neighbours"];
    if (puzzle.engine !== "boundary") throw new Error("wrong engine");

    const options = puzzle.level.neighbourOptions;
    const scores = options.map((k) => evaluateNeighbours(k, puzzle.level));
    const lowest = scores[0];
    const highest = scores[scores.length - 1];

    expect(lowest.trainingAccuracy).toBe(1);
    expect(lowest.cleared).toBe(false);
    expect(lowest.generalisationGap).toBeGreaterThan(0.1);
    expect(highest.trainingAccuracy).toBeLessThan(0.6);
    expect(scores.some((score) => score.cleared)).toBe(true);
  });
});
