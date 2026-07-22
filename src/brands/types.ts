// Shape of a brand config. Each brand under this directory exports a
// BrandConfig constant; the runtime detector in src/lib/brand.ts picks
// which one to expose to the app based on window.location.hostname.

export interface BrandConfig {
  /** Stable identifier — matches the backend's src/lib/brand.ts entry. */
  id: "dragonbot" | "dragonrefunds";
  /** Public app hostname this brand is served from. */
  appHost: string;
  /** Full app origin (protocol + host, no trailing slash). Used as the
   *  `return_to` param when starting SP-API / Ads OAuth so the callback
   *  bounces the seller back to THIS brand's app, not the default. */
  appOrigin: string;
  /** Human-readable brand label shown in the header, page titles,
   *  emails, etc. DragonBot uses "getDragonBot.com"; Dragon Refunds
   *  uses "Dragon Refunds" (with a space). */
  headerLabel: string;
  /** Short brand name for HTML <title> and greetings. */
  displayName: string;
  /** Meta description for the HTML head. */
  metaDescription: string;
  /** Where users can email us with support questions. */
  supportEmail: string;
  /** GA4 measurement ID for this brand. */
  ga4MeasurementId: string;
  /** Microsoft Clarity project ID for this brand. */
  clarityId: string;
  /** postMessage type the backend sends after OAuth. Kept the same
   *  across brands for now — it's just a namespace to distinguish our
   *  messages, brand differentiation is meaningless here. */
  oauthMessageType: string;
  /** Parent domain for the first-touch attribution cookie set by the
   *  LP. `dragonbot` reads `.getdragonbot.com`, `dragonrefunds` reads
   *  `.dragonrefunds.com`. See src/lib/attribution.ts. */
  attributionCookieDomain: string;
}
