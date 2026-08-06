import type { BrandConfig } from "@ballisticbrands/frontend-shared";

export const DRAGONBOT: BrandConfig = {
  id: "dragonbot",
  appHost: "app.getdragonbot.com",
  appOrigin: "https://app.getdragonbot.com",
  headerLabel: "getDragonBot.com",
  displayName: "DragonBot",
  metaDescription:
    "DragonBot is a hosted MCP server for Amazon sellers. Sign in, mint scoped API keys, and let Claude, ChatGPT, and Cursor run your Seller Central.",
  supportEmail: "info@getdragonbot.com",
  ga4MeasurementId: "G-W5BRXVBQNR",
  clarityId: "vlbup1aiix",
  oauthMessageType: "dragonbot-oauth-result",
};

// Meta Pixel for the DragonBot dataset ("DragonBot website",
// Dragon Suite portfolio). Deliberately NOT a BrandConfig field —
// that type is owned by @ballisticbrands/frontend-shared, and the
// shared code only ever calls window.fbq behind a typeof guard.
// main.tsx loads the base snippet with this ID.
export const META_PIXEL_ID = "881227664817776";
