"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-cream text-ink hover:bg-rose disabled:hover:bg-cream",
  secondary: "border border-sky text-sky hover:bg-sky hover:text-ink disabled:hover:bg-transparent disabled:hover:text-sky",
  ghost: "text-cream-muted hover:text-cream",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-panel px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]} ${className}`}
    />
  );
}
