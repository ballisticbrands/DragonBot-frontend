import * as React from "react";

type Tone = "neutral" | "success" | "warn" | "danger" | "accent";
const TONE: Record<Tone, string> = {
  neutral: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  success: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  accent: "bg-orange-100 text-orange-800",
};

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${TONE[tone]} ${className}`}
    />
  );
}
