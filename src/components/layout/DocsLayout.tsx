import { Link, NavLink } from "react-router-dom";
import { useBrand } from "@/lib/brand-context";
import { docs } from "@/docs/registry";

// Public documentation shell: a brand header plus a left sidebar listing
// every doc in the registry. Unlike AppLayout this has no auth guard —
// docs are public. The active doc renders into `children` wrapped in the
// .docs-prose container (see globals.css) for typographic styling.
export function DocsLayout({ children }: { children: React.ReactNode }) {
  const brand = useBrand();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link
              to="/docs"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <img src="/DragonBot-logo.png" alt={brand.displayName} className="h-7 w-7 rounded" />
              {brand.headerLabel}
              <span className="text-[var(--muted-foreground)] font-normal">Docs</span>
            </Link>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              to="/dashboard"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-6 py-10">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-10 flex flex-col gap-1 text-sm">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Documentation
            </p>
            {docs.map((doc) => (
              <NavLink
                key={doc.slug}
                to={`/docs/${doc.slug}`}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 ${
                    isActive
                      ? "bg-[var(--muted)] font-medium text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`
                }
              >
                {doc.title}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <article className="docs-prose">{children}</article>
        </main>
      </div>
    </div>
  );
}
