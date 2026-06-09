import { useState } from "react";

export function CodeBlock({
  code,
  language,
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignored
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-[var(--border)]">
      {(filename || language) && (
        <div className="flex items-center justify-between bg-[var(--muted)] px-3 py-1.5 text-xs">
          <span className="font-mono text-[var(--muted-foreground)]">{filename ?? language}</span>
          <button
            type="button"
            onClick={copy}
            className="rounded px-2 py-0.5 text-xs font-medium hover:bg-white"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre className="bg-[var(--code-bg)] text-[var(--code-fg)] overflow-x-auto p-4 text-sm leading-6">
        <code className="font-mono">{code}</code>
      </pre>
      {!filename && !language && (
        <div className="flex justify-end px-2 py-1 bg-[var(--muted)]">
          <button
            type="button"
            onClick={copy}
            className="rounded px-2 py-0.5 text-xs font-medium hover:bg-white"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
