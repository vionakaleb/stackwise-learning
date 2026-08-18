export function percent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function accentClasses(accent: "blue" | "peach" | "rose" | "umber") {
  const map = {
    blue: { text: "text-sky", border: "border-sky", dot: "bg-sky" },
    peach: { text: "text-cream", border: "border-cream", dot: "bg-cream" },
    rose: { text: "text-rose", border: "border-rose", dot: "bg-rose" },
    umber: { text: "text-umber-light", border: "border-umber-light", dot: "bg-umber-light" },
  } as const;
  return map[accent];
}
