export type ClassLabel = 0 | 1;

export interface LabeledPoint {
  x: number;
  y: number;
  label: ClassLabel;
}

export interface LinearBoundary {
  weightX: number;
  weightY: number;
  bias: number;
}

export interface BoundaryLevel {
  id: string;
  trainingPoints: LabeledPoint[];
  testPoints: LabeledPoint[];
  targetTestAccuracy: number;
  neighbourOptions: number[];
}

export function boundaryFromHandles(
  start: { x: number; y: number },
  end: { x: number; y: number },
): LinearBoundary {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  return {
    weightX: -deltaY,
    weightY: deltaX,
    bias: deltaY * start.x - deltaX * start.y,
  };
}

export function classifyWithBoundary(point: { x: number; y: number }, boundary: LinearBoundary): ClassLabel {
  const score = boundary.weightX * point.x + boundary.weightY * point.y + boundary.bias;
  return score >= 0 ? 1 : 0;
}

export function accuracy(points: LabeledPoint[], predict: (point: LabeledPoint) => ClassLabel): number {
  if (points.length === 0) return 0;
  const correct = points.filter((point) => predict(point) === point.label).length;
  return correct / points.length;
}

function squaredDistance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return (left.x - right.x) ** 2 + (left.y - right.y) ** 2;
}

export class NeighbourCountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NeighbourCountError";
  }
}

export function classifyWithNeighbours(
  point: { x: number; y: number },
  trainingPoints: LabeledPoint[],
  neighbourCount: number,
): ClassLabel {
  if (!Number.isInteger(neighbourCount) || neighbourCount < 1) {
    throw new NeighbourCountError("Neighbour count must be a whole number of one or more.");
  }
  if (trainingPoints.length === 0) {
    throw new NeighbourCountError("Nearest neighbours needs at least one training point.");
  }

  const nearest = [...trainingPoints]
    .sort((left, right) => squaredDistance(point, left) - squaredDistance(point, right))
    .slice(0, Math.min(neighbourCount, trainingPoints.length));

  const positives = nearest.filter((neighbour) => neighbour.label === 1).length;
  return positives * 2 >= nearest.length ? 1 : 0;
}

export interface TrainingSettings {
  learningRate: number;
  epochs: number;
}

const defaultTrainingSettings: TrainingSettings = { learningRate: 0.35, epochs: 400 };

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

export function trainLogisticRegression(
  trainingPoints: LabeledPoint[],
  settings: TrainingSettings = defaultTrainingSettings,
): LinearBoundary {
  let weightX = 0;
  let weightY = 0;
  let bias = 0;

  for (let epoch = 0; epoch < settings.epochs; epoch += 1) {
    let gradientX = 0;
    let gradientY = 0;
    let gradientBias = 0;

    for (const point of trainingPoints) {
      const prediction = sigmoid(weightX * point.x + weightY * point.y + bias);
      const error = prediction - point.label;
      gradientX += error * point.x;
      gradientY += error * point.y;
      gradientBias += error;
    }

    const scale = settings.learningRate / Math.max(1, trainingPoints.length);
    weightX -= scale * gradientX;
    weightY -= scale * gradientY;
    bias -= scale * gradientBias;
  }

  return { weightX, weightY, bias };
}

export interface BoundaryVerdict {
  trainingAccuracy: number;
  testAccuracy: number;
  generalisationGap: number;
  targetTestAccuracy: number;
  cleared: boolean;
}

export function evaluateBoundary(boundary: LinearBoundary, level: BoundaryLevel): BoundaryVerdict {
  const predict = (point: LabeledPoint) => classifyWithBoundary(point, boundary);
  const trainingAccuracy = accuracy(level.trainingPoints, predict);
  const testAccuracy = accuracy(level.testPoints, predict);

  return {
    trainingAccuracy,
    testAccuracy,
    generalisationGap: trainingAccuracy - testAccuracy,
    targetTestAccuracy: level.targetTestAccuracy,
    cleared: testAccuracy >= level.targetTestAccuracy,
  };
}

export function evaluateNeighbours(neighbourCount: number, level: BoundaryLevel): BoundaryVerdict {
  const trainingAccuracy = accuracy(level.trainingPoints, (point) =>
    classifyWithNeighbours(point, level.trainingPoints, neighbourCount),
  );
  const testAccuracy = accuracy(level.testPoints, (point) =>
    classifyWithNeighbours(point, level.trainingPoints, neighbourCount),
  );

  return {
    trainingAccuracy,
    testAccuracy,
    generalisationGap: trainingAccuracy - testAccuracy,
    targetTestAccuracy: level.targetTestAccuracy,
    cleared: testAccuracy >= level.targetTestAccuracy,
  };
}
