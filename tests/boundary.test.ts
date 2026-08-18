import { describe, expect, it } from "vitest";
import {
  BoundaryLevel,
  NeighbourCountError,
  accuracy,
  boundaryFromHandles,
  classifyWithBoundary,
  classifyWithNeighbours,
  evaluateBoundary,
  evaluateNeighbours,
  trainLogisticRegression,
} from "@/engines/boundary/engine";

const separable: BoundaryLevel = {
  id: "boundary-test",
  trainingPoints: [
    { x: -4, y: -3, label: 0 },
    { x: -3, y: -4, label: 0 },
    { x: -5, y: -2, label: 0 },
    { x: 4, y: 3, label: 1 },
    { x: 3, y: 4, label: 1 },
    { x: 5, y: 2, label: 1 },
  ],
  testPoints: [
    { x: -4, y: -4, label: 0 },
    { x: 4, y: 4, label: 1 },
  ],
  targetTestAccuracy: 1,
  neighbourOptions: [1, 3, 5],
};

describe("decision boundary", () => {
  it("splits the plane along the line the two handles define", () => {
    const boundary = boundaryFromHandles({ x: -5, y: 5 }, { x: 5, y: -5 });
    expect(classifyWithBoundary({ x: 4, y: 4 }, boundary)).toBe(1);
    expect(classifyWithBoundary({ x: -4, y: -4 }, boundary)).toBe(0);
  });

  it("scores a hand-drawn boundary on held-out points", () => {
    const boundary = boundaryFromHandles({ x: -5, y: 5 }, { x: 5, y: -5 });
    expect(evaluateBoundary(boundary, separable).cleared).toBe(true);
  });

  it("scores a boundary pointing the wrong way as no better than guessing", () => {
    const flipped = boundaryFromHandles({ x: 5, y: -5 }, { x: -5, y: 5 });
    expect(evaluateBoundary(flipped, separable).testAccuracy).toBe(0);
  });

  it("trains a linear model that separates a separable set", () => {
    const learned = trainLogisticRegression(separable.trainingPoints);
    expect(evaluateBoundary(learned, separable).trainingAccuracy).toBe(1);
  });

  it("memorises the training set at one neighbour", () => {
    expect(evaluateNeighbours(1, separable).trainingAccuracy).toBe(1);
  });

  it("rejects a neighbour count below one", () => {
    expect(() => classifyWithNeighbours({ x: 0, y: 0 }, separable.trainingPoints, 0)).toThrow(
      NeighbourCountError,
    );
  });

  it("returns zero accuracy for an empty point set", () => {
    expect(accuracy([], () => 1)).toBe(0);
  });
});
