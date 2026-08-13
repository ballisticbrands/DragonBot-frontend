import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSession } from "@ballisticbrands/frontend-shared";
import { useBrand } from "@ballisticbrands/frontend-shared";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { ForgotPasswordPage, MagicLoginPage, VerifyEmailPage } from "@ballisticbrands/frontend-shared";
import { Index } from "@/pages/Index";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import { Dashboard } from "@/pages/Dashboard";
import { ConnectAi, DataSources, Keys, Settings, Support } from "@/pages/AppPages";
import { Docs } from "@/pages/Docs";
import { defaultDoc } from "@/docs/registry";

export default function App() {
  // Update document title on route change so each page has a sensible
  // tab title. Per-page titles override via the useEffect inside each
  // page; this is the fallback.
  const location = useLocation();
  const brand = useBrand();
  useEffect(() => {
    document.title = `${brand.displayName} — Amazon Seller MCP for AI agents`;
  }, [location.pathname, brand.displayName]);

  // SPA route pageviews. gtag('config') and the Meta base snippet each fire
  // exactly one pageview, on hard load — neither knows about client-side
  // navigation. Without this every in-app route past the entry page goes
  // uncounted in GA4 and never reaches the Meta Pixel. Skip the first run:
  // the loaders in main.tsx already counted the initial load, so firing here
  // too would double-count it.
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      fbq?: (...args: unknown[]) => void;
    };
    try {
      w.gtag?.("event", "page_view", {
        page_path: location.pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
      w.fbq?.("track", "PageView");
    } catch {
      /* analytics must never break the app */
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/sign-in"
        element={
          <PublicOnly>
            <AuthLayout>
              <SignIn />
            </AuthLayout>
          </PublicOnly>
        }
      />
      <Route
        path="/sign-up"
        element={
          <PublicOnly>
            {/* Widest column: /sign-up runs the AI chat preview and the
                signup form as two side-by-side halves. */}
            <AuthLayout width="xl">
              <SignUp />
            </AuthLayout>
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        }
      />
      {/* Signed-in app. Each of these was a `?tab=` on /dashboard; they
          became routes when the tab strip became a left rail. The old
          query-string URLs are redirected below so bookmarks and the
          setup email's links keep working. */}
      <Route path="/dashboard" element={<LegacyTabRedirect><AppLayout><Dashboard /></AppLayout></LegacyTabRedirect>} />
      <Route path="/connect-ai" element={<AppLayout><ConnectAi /></AppLayout>} />
      <Route path="/data" element={<AppLayout><DataSources /></AppLayout>} />
      <Route path="/keys" element={<AppLayout><Keys /></AppLayout>} />
      <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
      <Route path="/support" element={<AppLayout><Support /></AppLayout>} />
      <Route path="/docs" element={<Navigate to={`/docs/${defaultDoc.slug}`} replace />} />
      <Route path="/docs/:slug" element={<Docs />} />
      {/* /verify is public — the token in the URL is the credential. */}
      <Route path="/verify" element={<VerifyEmailPage />} />
      {/* /magic is public for the same reason: the emailed one-time
          token IS the credential. Redeems it and lands on /dashboard. */}
      <Route path="/magic" element={<MagicLoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * The dashboard's sections used to be `?tab=` values on /dashboard.
 * They're routes now, but the setup email, the docs and anyone's
 * bookmarks still carry the old URLs — so translate them rather than
 * silently dropping people on the wrong page.
 *
 * `?tab=data` is the interesting case: it was the DEFAULT tab, so a
 * bare /dashboard and /dashboard?tab=data used to be the same page.
 * They aren't any more — /dashboard is the numbers, /data is the
 * connection manager — and an explicit `tab=data` meant the latter.
 */
const LEGACY_TABS: Record<string, string> = {
  data: "/data",
  keys: "/keys",
  settings: "/settings",
  support: "/support",
};

function LegacyTabRedirect({ children }: { children: React.ReactNode }) {
  const { search } = useLocation();
  const tab = new URLSearchParams(search).get("tab");
  const target = tab ? LEGACY_TABS[tab] : undefined;
  if (target) return <Navigate to={target} replace />;
  return <>{children}</>;
}

/**
 * If the user is already signed in, bounce them to /dashboard. Used to
 * wrap /sign-in and /sign-up so a logged-in user doesn't see them.
 */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (session.status === "loading") return <div className="min-h-screen" />;
  if (session.status === "authenticated") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
