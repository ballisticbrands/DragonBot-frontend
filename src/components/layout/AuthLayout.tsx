import { config } from "@/lib/config";
import { useBrand } from "@ballisticbrands/frontend-shared";
import { BrandLockup } from "@/components/BrandLockup";

/**
 * `width` sizes the content column. "sm" is the default narrow auth card
 * (sign-in, forgot-password); "lg" suits a single wide card; "xl" is for
 * /sign-up, which puts the AI chat preview and the signup form in two
 * side-by-side halves — at max-w-3xl each half is ~360px and the form
 * fields start wrapping badly.
 *
 * Same map as DragonRefunds-frontend's AuthLayout, deliberately.
 */
const WIDTHS = {
  sm: "max-w-sm",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
} as const;

export function AuthLayout({
  children,
  width = "sm",
}: {
  children: React.ReactNode;
  width?: keyof typeof WIDTHS;
}) {
  const brand = useBrand();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandLockup to="/" />
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
        <div className={`w-full ${WIDTHS[width]}`}>{children}</div>
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
