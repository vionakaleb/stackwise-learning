import { describe, expect, it } from "vitest";
import {
  ArrayLevel,
  InvalidOperationError,
  applyOperation,
  createInitialState,
  evaluate,
  isSorted,
  replayOperations,
} from "@/engines/arrayops/engine";

const sortLevel: ArrayLevel = {
  id: "sort-test",
  goal: "sorted",
  startValues: [3, 1, 2],
  budget: 5,
  hiddenUntilProbed: false,
  allowedOperations: ["compare", "swap"],
};

const searchLevel: ArrayLevel = {
  id: "search-test",
  goal: "findTarget",
  startValues: [2, 4, 6, 8, 10, 12, 14, 16],
  budget: 3,
  target: 14,
  hiddenUntilProbed: true,
  allowedOperations: ["probe"],
};

describe("array operation budget", () => {
  it("charges one unit for every operation", () => {
    const afterCompare = applyOperation(createInitialState(sortLevel), { kind: "compare", left: 0, right: 1 }, sortLevel);
    expect(afterCompare.cost).toBe(1);
  });

  it("reports the comparison verdict without changing the array", () => {
    const state = applyOperation(createInitialState(sortLevel), { kind: "compare", left: 0, right: 1 }, sortLevel);
    expect(state.lastComparison?.verdict).toBe("greater");
    expect(state.values).toEqual([3, 1, 2]);
  });

  it("swaps two positions", () => {
    const state = applyOperation(createInitialState(sortLevel), { kind: "swap", left: 0, right: 1 }, sortLevel);
    expect(state.values).toEqual([1, 3, 2]);
  });

  it("rejects operations the level does not allow", () => {
    expect(() =>
      applyOperation(createInitialState(searchLevel), { kind: "swap", left: 0, right: 1 }, searchLevel),
    ).toThrow(InvalidOperationError);
  });

  it("rejects an index outside the array", () => {
    expect(() =>
      applyOperation(createInitialState(sortLevel), { kind: "swap", left: 0, right: 9 }, sortLevel),
    ).toThrow(InvalidOperationError);
  });

  it("clears a sort level only when the array is sorted and the budget holds", () => {
    const solved = replayOperations(sortLevel, [
      { kind: "swap", left: 0, right: 1 },
      { kind: "swap", left: 1, right: 2 },
    ]);
    expect(evaluate(solved, sortLevel).cleared).toBe(true);
  });

  it("fails a sort level that runs past the budget", () => {
    const wasteful: ArrayLevel = { ...sortLevel, budget: 1 };
    const state = replayOperations(wasteful, [
      { kind: "swap", left: 0, right: 1 },
      { kind: "swap", left: 1, right: 2 },
    ]);
    const verdict = evaluate(state, wasteful);
    expect(verdict.goalReached).toBe(true);
    expect(verdict.cleared).toBe(false);
  });

  it("reveals a value only once it has been probed", () => {
    const state = applyOperation(createInitialState(searchLevel), { kind: "probe", index: 3 }, searchLevel);
    expect(state.revealedIndexes).toEqual([3]);
  });

  it("finds the target inside the budget with halving probes", () => {
    const state = replayOperations(searchLevel, [
      { kind: "probe", index: 3 },
      { kind: "probe", index: 5 },
      { kind: "probe", index: 6 },
    ]);
    expect(evaluate(state, searchLevel).cleared).toBe(true);
  });

  it("runs out of budget when probing one index at a time", () => {
    const state = replayOperations(searchLevel, [
      { kind: "probe", index: 0 },
      { kind: "probe", index: 1 },
      { kind: "probe", index: 2 },
      { kind: "probe", index: 3 },
      { kind: "probe", index: 4 },
      { kind: "probe", index: 5 },
      { kind: "probe", index: 6 },
    ]);
    expect(evaluate(state, searchLevel).withinBudget).toBe(false);
  });

  it("treats an empty array and a single value as sorted", () => {
    expect(isSorted([])).toBe(true);
    expect(isSorted([7])).toBe(true);
  });
});
