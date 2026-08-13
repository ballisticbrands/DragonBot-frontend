import { Link, useNavigate } from "react-router-dom";
import {
  AppShell,
  ChartIcon,
  DatabaseIcon,
  KeyIcon,
  LifebuoyIcon,
  PlugIcon,
  SettingsIcon,
  signOut,
  useSession,
  type NavItem,
} from "@ballisticbrands/frontend-shared";
import { BrandLockup } from "@/components/BrandLockup";

// Signed-in chrome. Was a top bar plus a four-tab strip inside the
// dashboard page; now a left rail from the shared AppShell.
//
// Why the change: tabs gave Data / Keys / Settings / Support equal
// weight, which is how you organise a settings panel. The two things a
// seller should actually live in — their numbers and getting their AI
// wired up — didn't exist as destinations at all. The rail separates
// the product from the housekeeping and has room for both.

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <ChartIcon /> },
  { to: "/connect-ai", label: "Connect your AI", icon: <PlugIcon /> },
  { to: "/data", label: "Data sources", icon: <DatabaseIcon />, section: "Setup" },
  { to: "/keys", label: "API keys", icon: <KeyIcon /> },
  { to: "/settings", label: "Settings", icon: <SettingsIcon />, section: "Account" },
  { to: "/support", label: "Support", icon: <LifebuoyIcon /> },
];

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

  const logOut = async () => {
    await signOut();
    navigate("/sign-in", { replace: true });
  };

  return (
    <AppShell
      items={NAV}
      navHeader={<BrandLockup to="/dashboard" />}
      navFooter={
        <div className="flex flex-col gap-2">
          <span
            className="truncate text-[12px] text-[var(--muted-foreground)]"
            title={session.user.email}
          >
            {session.user.email}
          </span>
          <div className="flex items-center gap-3 text-[12px]">
            <Link
              to="/docs"
              target="_blank"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Docs
            </Link>
            <button
              type="button"
              onClick={() => void logOut()}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Log out
            </button>
          </div>
        </div>
      }
      mobileActions={
        <button
          type="button"
          onClick={() => void logOut()}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]"
        >
          Log out
        </button>
      }
    >
      {children}
    </AppShell>
  );
}
