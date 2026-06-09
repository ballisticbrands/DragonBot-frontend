import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignored
        }
      }}
      className={`inline-flex h-8 items-center rounded-md border border-[var(--border)] bg-white px-3 text-xs font-medium hover:bg-[var(--muted)] ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
