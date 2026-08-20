import type { Metadata } from "next";
import { ProgressBoard } from "@/features/progress/ProgressBoard";

export const metadata: Metadata = {
  title: "Progress - StackWise",
  description: "Your calibration score, puzzles cleared, and concepts finished.",
};

export default function ProgressPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-sky">Stored in this browser only</p>
        <h1 className="mt-3 text-4xl">Progress</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-cream-muted">
          Lessons completed is a weak signal. Calibration is the one that tells you something, because it
          measures how often your prediction matched what actually happened.
        </p>
      </header>

      <ProgressBoard />
    </div>
  );
}
