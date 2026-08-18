import type { Confidence } from "@/types/content";

const labels: Record<Confidence, { text: string; className: string }> = {
  verified: { text: "verified against a primary source", className: "border-sky text-sky" },
  "widely-documented": { text: "widely documented, not re-verified here", className: "border-umber-light text-umber-light" },
  interpretation: { text: "interpretation, not a sourced claim", className: "border-rose text-rose" },
};

export function ConfidenceTag({ confidence }: { confidence: Confidence }) {
  const label = labels[confidence];
  return (
    <span className={`eyebrow inline-block rounded-panel border px-2 py-1 ${label.className}`}>
      {label.text}
    </span>
  );
}
