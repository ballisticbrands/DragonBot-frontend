import { Navigate } from "react-router-dom";
import { useSession } from "@ballisticbrands/frontend-shared";

/**
 * Root route. Redirects to /dashboard if signed in, /sign-in otherwise.
 * Renders nothing while the session probe is in flight.
 */
export function Index() {
  const session = useSession();
  if (session.status === "loading") return <div className="min-h-screen" />;
  return <Navigate to={session.status === "authenticated" ? "/dashboard" : "/sign-in"} replace />;
}
