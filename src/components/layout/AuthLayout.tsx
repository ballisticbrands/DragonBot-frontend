import { Link } from "react-router-dom";
import { config } from "@/lib/config";
import { useBrand } from "@ballisticbrands/frontend-shared";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = useBrand();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <img src="/DragonBot-logo.png" alt={brand.displayName} className="h-7 w-7 rounded" />
          {brand.headerLabel}
        </Link>
        <a
          href={config.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Docs
        </a>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="px-6 py-6 text-xs text-[var(--muted-foreground)] flex gap-4">
        <a href={config.docsUrl} target="_blank" rel="noreferrer">
          Docs
        </a>
        <a href={`mailto:${brand.supportEmail}`}>Support</a>
      </footer>
    </div>
  );
}
