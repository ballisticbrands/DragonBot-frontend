// "On this page" table of contents for a doc. Pass the section headings as
// { id, label }; each links to the matching heading's id (anchors scroll in
// page — headings get scroll-margin-top via .docs-prose so they clear the
// top of the viewport). Reusable across guides.
export function TableOfContents({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav
      aria-label="Table of contents"
      className="my-6 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        On this page
      </p>
      <ol className="m-0 list-none space-y-1 p-0">
        {items.map((item, i) => (
          <li key={item.id} className="m-0">
            <a href={`#${item.id}`} className="text-sm">
              <span className="text-[var(--muted-foreground)]">{i + 1}.</span> {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
