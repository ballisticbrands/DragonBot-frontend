import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@ballisticbrands/frontend-shared";
import { signOut } from "@ballisticbrands/frontend-shared";
import { BrandLockup } from "@/components/BrandLockup";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const navigate = useNavigate();

  // Route guard: bounce to /sign-in if not authenticated. Show a blank
  // shell while the /me probe is in flight (avoids a flash of the
  // dashboard before the auth check resolves).
  if (session.status === "loading") {
    return <div className="min-h-screen" />;
  }
  if (session.status === "anonymous") {
    navigate("/sign-in", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* No verify-email banner. Signup is email-only and passwordless in
          practice, so an unverified address is the normal state rather
          than a problem to nag about — and the banner was the first thing
          a new user saw on a page whose job is to get them to connect
          Amazon. The setup email carries the verify link as a P.S. for
          anyone who wants it. Same decision as DragonRefunds-frontend. */}
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            {/* Same logo treatment as the getdragonbot.com navbar: bobbing
                dragon + "getDragonBot.com" with the green gradient on the name. */}
            <BrandLockup to="/dashboard" />
            <nav className="flex items-center gap-5 text-sm">
              <Link to="/dashboard" className="text-[var(--foreground)]">
                Dashboard
              </Link>
              <a
                href="/docs"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                target="_blank"
                rel="noreferrer"
              >
                Docs
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--muted-foreground)]">{session.user.email}</span>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/sign-in", { replace: true });
              }}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--muted)]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
