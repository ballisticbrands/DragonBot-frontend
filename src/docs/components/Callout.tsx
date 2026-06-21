import type { ReactNode } from "react";

// A highlighted aside for docs — tips, warnings, recommendations. Sits
// outside the .docs-prose flow styling with its own card-like treatment.
export function Callout({
  title,
  tone = "tip",
  children,
}: {
  title?: string;
  tone?: "tip" | "warn";
  children: ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[var(--foreground)]";
  return (
    <div className={`my-6 rounded-lg border p-4 text-sm ${styles}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="[&_p]:m-0 [&_p+p]:mt-2">{children}</div>
    </div>
  );
}
