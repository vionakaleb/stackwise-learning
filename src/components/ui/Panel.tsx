import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}

export function Panel({ children, tone = "dark", className = "" }: PanelProps) {
  const toneClasses =
    tone === "light"
      ? "bg-cream text-ink border-cream"
      : "bg-ink text-cream border-ink-edge";
  return <div className={`rounded-panel border ${toneClasses} ${className}`}>{children}</div>;
}
