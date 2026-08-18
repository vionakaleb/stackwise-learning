"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { percent } from "@/lib/formatting";
import {
  type BoundaryLevel,
  type LabeledPoint,
  boundaryFromHandles,
  evaluateBoundary,
  evaluateNeighbours,
  trainLogisticRegression,
} from "@/engines/boundary/engine";

interface BoundaryPuzzleProps {
  level: BoundaryLevel;
  mode: "line" | "neighbours";
  onResult: (cleared: boolean, score: number) => void;
}

const viewSize = 360;
const dataRange = 10;

function toScreen(value: number): number {
  return ((value + dataRange) / (dataRange * 2)) * viewSize;
}

function toData(pixels: number): number {
  return (pixels / viewSize) * (dataRange * 2) - dataRange;
}

function pointFill(point: LabeledPoint): string {
  return point.label === 1 ? "var(--color-sky)" : "var(--color-rose)";
}

export function BoundaryPuzzle({ level, mode, onResult }: BoundaryPuzzleProps) {
  const [handles, setHandles] = useState({ start: { x: -9, y: 9 }, end: { x: 9, y: -9 } });
  const [neighbourCount, setNeighbourCount] = useState(level.neighbourOptions[0]);
  const [showTestPoints, setShowTestPoints] = useState(false);
  const [checked, setChecked] = useState(false);

  const boundary = useMemo(() => boundaryFromHandles(handles.start, handles.end), [handles]);
  const verdict = useMemo(
    () => (mode === "line" ? evaluateBoundary(boundary, level) : evaluateNeighbours(neighbourCount, level)),
    [mode, boundary, neighbourCount, level],
  );
  const trainedBoundary = useMemo(() => trainLogisticRegression(level.trainingPoints), [level]);
  const trainedVerdict = useMemo(() => evaluateBoundary(trainedBoundary, level), [trainedBoundary, level]);

  function dragHandle(which: "start" | "end", event: React.PointerEvent<SVGCircleElement>) {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      const bounds = svg.getBoundingClientRect();
      setHandles((current) => ({
        ...current,
        [which]: {
          x: toData(((moveEvent.clientX - bounds.left) / bounds.width) * viewSize),
          y: -toData(((moveEvent.clientY - bounds.top) / bounds.height) * viewSize),
        },
      }));
      setChecked(false);
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function handleCheck() {
    setShowTestPoints(true);
    setChecked(true);
    onResult(verdict.cleared, Math.round(verdict.generalisationGap * 100));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <svg
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          className="w-full max-w-[360px] rounded-panel border border-ink-edge bg-ink-deep touch-none"
          role="img"
          aria-label="Two-class scatter plot with an adjustable boundary"
        >
          <line x1={viewSize / 2} y1={0} x2={viewSize / 2} y2={viewSize} stroke="var(--color-ink-edge)" />
          <line x1={0} y1={viewSize / 2} x2={viewSize} y2={viewSize / 2} stroke="var(--color-ink-edge)" />

          {mode === "line" ? (
            <line
              x1={toScreen(handles.start.x)}
              y1={viewSize - toScreen(handles.start.y)}
              x2={toScreen(handles.end.x)}
              y2={viewSize - toScreen(handles.end.y)}
              stroke="var(--color-cream)"
              strokeWidth={2}
            />
          ) : null}

          {level.trainingPoints.map((point, index) => (
            <circle
              key={`train-${index}`}
              cx={toScreen(point.x)}
              cy={viewSize - toScreen(point.y)}
              r={6}
              fill={pointFill(point)}
            />
          ))}

          {showTestPoints
            ? level.testPoints.map((point, index) => (
                <circle
                  key={`test-${index}`}
                  cx={toScreen(point.x)}
                  cy={viewSize - toScreen(point.y)}
                  r={6}
                  fill="none"
                  stroke={pointFill(point)}
                  strokeWidth={2}
                  strokeDasharray="3 2"
                />
              ))
            : null}

          {mode === "line"
            ? (["start", "end"] as const).map((which) => (
                <circle
                  key={which}
                  cx={toScreen(handles[which].x)}
                  cy={viewSize - toScreen(handles[which].y)}
                  r={9}
                  fill="var(--color-cream)"
                  stroke="var(--color-ink)"
                  strokeWidth={2}
                  className="cursor-grab"
                  onPointerDown={(event) => dragHandle(which, event)}
                />
              ))
            : null}
        </svg>

        <div className="flex-1 space-y-3">
          {mode === "neighbours" ? (
            <label className="block">
              <span className="eyebrow text-cream-muted">Neighbours consulted (k)</span>
              <input
                type="range"
                min={0}
                max={level.neighbourOptions.length - 1}
                step={1}
                value={level.neighbourOptions.indexOf(neighbourCount)}
                onChange={(event) => {
                  setNeighbourCount(level.neighbourOptions[Number(event.target.value)]);
                  setChecked(false);
                }}
                className="mt-2 w-full accent-[var(--color-sky)]"
              />
              <span className="numeric mt-1 block text-lg">k = {neighbourCount}</span>
            </label>
          ) : (
            <p className="text-sm text-cream-muted">
              Drag either handle to move the line. Filled dots are training points. Dashed rings are the
              held-out test points, revealed once you check.
            </p>
          )}

          <dl className="numeric space-y-2 text-sm">
            <div className="flex justify-between border-b border-ink-edge pb-1">
              <dt className="text-cream-muted">Training accuracy</dt>
              <dd>{percent(verdict.trainingAccuracy, 1)}</dd>
            </div>
            <div className="flex justify-between border-b border-ink-edge pb-1">
              <dt className="text-cream-muted">Test accuracy</dt>
              <dd className={verdict.cleared ? "text-sky" : "text-rose"}>
                {checked ? percent(verdict.testAccuracy, 1) : "hidden until you check"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream-muted">Gap</dt>
              <dd>{checked ? percent(verdict.generalisationGap, 1) : "-"}</dd>
            </div>
          </dl>

          <Button onClick={handleCheck}>Score against the test set</Button>
        </div>
      </div>

      {checked ? (
        <div
          className={`rounded-panel border px-4 py-3 text-sm ${
            verdict.cleared ? "border-sky text-sky" : "border-rose text-rose"
          }`}
          role="status"
        >
          <p>
            {verdict.cleared
              ? `Cleared. Test accuracy ${percent(verdict.testAccuracy, 1)} against a target of ${percent(level.targetTestAccuracy, 1)}.`
              : `Test accuracy ${percent(verdict.testAccuracy, 1)}, below the ${percent(level.targetTestAccuracy, 1)} target.`}
          </p>
          {mode === "line" ? (
            <p className="mt-2 text-cream-muted">
              A logistic regression trained on the same points scores{" "}
              {percent(trainedVerdict.testAccuracy, 1)} on the test set.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
