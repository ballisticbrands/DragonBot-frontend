// Build-time configuration for the shared Dragon frontend bundle.
// Vite inlines VITE_* env vars into the client JS bundle at build.
// Defaults match the production shared backend.
//
// Per-brand values (name, logo alt text, GA4 ID, Clarity ID, header
// label, support email) do NOT live here — they're picked at runtime
// from window.location.hostname via src/brands/. Anything you find
// yourself wanting to vary per brand should move there, not into this
// file.

export const config = {
  // The shared backend for all Dragon brand apps. Bearer tokens issued
  // by /v1/auth/sign-in on this host work from any of the brand app
  // frontends — one User table across all brands.
  apiUrl: (import.meta.env.VITE_API_URL ?? "https://api.getdragonbot.com").replace(/\/$/, ""),
  // The public MCP endpoint clients connect to. Same host + /mcp path.
  mcpUrl: import.meta.env.VITE_MCP_URL ?? "https://api.getdragonbot.com/mcp",
  // Documentation home. Served by this same SPA under /docs.
  docsUrl: import.meta.env.VITE_DOCS_URL ?? "/docs",
  // Cloudflare Turnstile public site key. Paired with the backend's
  // TURNSTILE_SECRET_KEY. When empty (local dev / preview builds), the
  // <Turnstile> widget short-circuits with a "skipped" token — the
  // backend's verifyTurnstile also skips when its secret is unset, so
  // the two ends stay in agreement without any test-mode plumbing.
  //
  // The same widget serves multiple brand hostnames (allowlisted in
  // the Cloudflare Dashboard) so this stays a single value across all
  // brands.
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "",
  // Google OAuth Web client ID for "Sign in with Google". Paired with
  // the backend's GOOGLE_CLIENT_ID (same value — it's public, not a
  // secret). When empty (local dev without Google set up), the shared
  // <GoogleSignInButton> renders nothing and the auth pages show only
  // the email/password form. One Web client serves all brand apps;
  // each app origin must be on its "Authorized JavaScript origins".
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
};

export const SESSION_KEY = "dragonbot_session";
