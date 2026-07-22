import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSession } from "@ballisticbrands/frontend-shared";
import { useBrand } from "@ballisticbrands/frontend-shared";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { Index } from "@/pages/Index";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { Dashboard } from "@/pages/Dashboard";
import { Docs } from "@/pages/Docs";
import { VerifyEmail } from "@/pages/VerifyEmail";
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
            <AuthLayout>
              <SignUp />
            </AuthLayout>
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AuthLayout>
            <ForgotPassword />
          </AuthLayout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />
      <Route path="/docs" element={<Navigate to={`/docs/${defaultDoc.slug}`} replace />} />
      <Route path="/docs/:slug" element={<Docs />} />
      {/* /verify is public — the token in the URL is the credential. */}
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
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
