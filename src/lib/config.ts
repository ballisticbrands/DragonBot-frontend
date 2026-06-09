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
  appUrl: import.meta.env.VITE_APP_URL ?? "https://app.dragonsellerbot.com",
  // Documentation home.
  docsUrl: import.meta.env.VITE_DOCS_URL ?? "https://github.com/ballisticbrands/DragonBot/blob/main/README.md",
  // Brand. Surfaced in titles, headers, and the OAuth-popup postMessage type
  // (the backend sends `${tenantId}-oauth-result` per config/tenants/dragonbot.json).
  brand: {
    name: "DragonBot",
    slug: "dragonbot",
    oauthMessageType: "dragonbot-oauth-result",
    supportEmail: "info@getdragonbot.com",
  },
};

export const SESSION_KEY = "dragonbot_session";
