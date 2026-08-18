export type ArrayGoal = "sorted" | "findTarget";

export type ArrayOperation =
  | { kind: "compare"; left: number; right: number }
  | { kind: "swap"; left: number; right: number }
  | { kind: "probe"; index: number };

export interface ArrayLevel {
  id: string;
  goal: ArrayGoal;
  startValues: number[];
  budget: number;
  target?: number;
  hiddenUntilProbed: boolean;
  allowedOperations: ArrayOperation["kind"][];
}

export interface ArrayPuzzleState {
  values: number[];
  cost: number;
  operations: ArrayOperation[];
  revealedIndexes: number[];
  lastComparison: { left: number; right: number; verdict: "less" | "equal" | "greater" } | null;
  foundIndex: number | null;
}

export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOperationError";
  }
}

export function createInitialState(level: ArrayLevel): ArrayPuzzleState {
  return {
    values: [...level.startValues],
    cost: 0,
    operations: [],
    revealedIndexes: level.hiddenUntilProbed ? [] : level.startValues.map((_, index) => index),
    lastComparison: null,
    foundIndex: null,
  };
}

function assertIndexInRange(index: number, length: number) {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new InvalidOperationError(`Index ${index} is outside the array.`);
  }
}

function assertOperationAllowed(level: ArrayLevel, operation: ArrayOperation) {
  if (!level.allowedOperations.includes(operation.kind)) {
    throw new InvalidOperationError(`Operation "${operation.kind}" is not available on this level.`);
  }
}

function compareVerdict(left: number, right: number): "less" | "equal" | "greater" {
  if (left < right) return "less";
  if (left > right) return "greater";
  return "equal";
}

export function applyOperation(
  state: ArrayPuzzleState,
  operation: ArrayOperation,
  level: ArrayLevel,
): ArrayPuzzleState {
  assertOperationAllowed(level, operation);

  if (operation.kind === "probe") {
    assertIndexInRange(operation.index, state.values.length);
    const revealedIndexes = state.revealedIndexes.includes(operation.index)
      ? state.revealedIndexes
      : [...state.revealedIndexes, operation.index];
    const probedValue = state.values[operation.index];
    return {
      ...state,
      cost: state.cost + 1,
      operations: [...state.operations, operation],
      revealedIndexes,
      foundIndex: probedValue === level.target ? operation.index : state.foundIndex,
    };
  }

  assertIndexInRange(operation.left, state.values.length);
  assertIndexInRange(operation.right, state.values.length);

  if (operation.kind === "compare") {
    return {
      ...state,
      cost: state.cost + 1,
      operations: [...state.operations, operation],
      lastComparison: {
        left: operation.left,
        right: operation.right,
        verdict: compareVerdict(state.values[operation.left], state.values[operation.right]),
      },
    };
  }

  const values = [...state.values];
  [values[operation.left], values[operation.right]] = [values[operation.right], values[operation.left]];
  return {
    ...state,
    values,
    cost: state.cost + 1,
    operations: [...state.operations, operation],
    lastComparison: null,
  };
}

export function isSorted(values: number[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] <= value);
}

export interface ArrayPuzzleVerdict {
  goalReached: boolean;
  withinBudget: boolean;
  cost: number;
  budget: number;
  cleared: boolean;
}

export function evaluate(state: ArrayPuzzleState, level: ArrayLevel): ArrayPuzzleVerdict {
  const goalReached = level.goal === "sorted" ? isSorted(state.values) : state.foundIndex !== null;
  const withinBudget = state.cost <= level.budget;
  return {
    goalReached,
    withinBudget,
    cost: state.cost,
    budget: level.budget,
    cleared: goalReached && withinBudget,
  };
}

export function replayOperations(level: ArrayLevel, operations: ArrayOperation[]): ArrayPuzzleState {
  return operations.reduce(
    (state, operation) => applyOperation(state, operation, level),
    createInitialState(level),
  );
}
