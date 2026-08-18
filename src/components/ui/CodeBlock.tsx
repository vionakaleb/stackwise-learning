interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  return (
    <figure className="rounded-panel border border-ink-edge bg-ink-deep">
      <figcaption className="eyebrow flex items-center justify-between border-b border-ink-edge px-4 py-2 text-sky">
        <span>{language}</span>
        <span className="text-cream-muted">read only</span>
      </figcaption>
      <pre className="overflow-x-auto px-4 py-4 text-[0.8125rem] leading-relaxed">
        <code className="numeric text-cream">{code}</code>
      </pre>
    </figure>
  );
}
