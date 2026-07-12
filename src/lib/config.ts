// Build-time configuration for the DragonBot frontend.
// Vite inlines VITE_* env vars into the client JS bundle at build.
// Defaults match the production DragonBot deploy. Override via .env.local
// for local dev pointing at a different backend.

export const config = {
  // The DragonBot MCP backend.
  apiUrl: (import.meta.env.VITE_API_URL ?? "https://api.getdragonbot.com").replace(/\/$/, ""),
  // The public MCP endpoint clients connect to. Same host + /mcp path.
  mcpUrl: import.meta.env.VITE_MCP_URL ?? "https://api.getdragonbot.com/mcp",
  // This frontend's own public URL — used for OAuth popup target_origin checks.
  appUrl: import.meta.env.VITE_APP_URL ?? "https://app.getdragonbot.com",
  // Documentation home. Served by this same SPA under /docs.
  docsUrl: import.meta.env.VITE_DOCS_URL ?? "/docs",
  // Brand. Surfaced in titles, headers, and the OAuth-popup postMessage type
  // (the backend sends `${tenantId}-oauth-result` per config/tenants/dragonbot.json).
  brand: {
    name: "DragonBot",
    slug: "dragonbot",
    oauthMessageType: "dragonbot-oauth-result",
    supportEmail: "info@getdragonbot.com",
  },
  // Cloudflare Turnstile public site key. Paired with the backend's
  // TURNSTILE_SECRET_KEY. When empty (local dev / preview builds), the
  // <Turnstile> widget short-circuits with a "skipped" token — the
  // backend's verifyTurnstile also skips when its secret is unset, so
  // the two ends stay in agreement without any test-mode plumbing.
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "",
};

export const SESSION_KEY = "dragonbot_session";
