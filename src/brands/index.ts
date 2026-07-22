// Brand registry + runtime detection.
//
// The same JS bundle is served from both app.getdragonbot.com AND
// app.dragonrefunds.com (single Cloudflare Pages project, two custom
// domains). At mount time we read window.location.hostname and pick
// the matching BrandConfig. That resolved brand flows to every UI
// component via <BrandProvider> + useBrand().
//
// Adding a brand: create a new file under this directory exporting a
// BrandConfig, add it to BY_HOST below, add its app.<host> to the
// backend's CORS allowlist + src/lib/brand.ts, and set up Cloudflare
// Pages + DNS for its hostname.

import type { BrandConfig } from "./types";
import { DRAGONBOT } from "./dragonbot";
import { DRAGONREFUNDS } from "./dragonrefunds";

export type { BrandConfig } from "./types";
export { DRAGONBOT, DRAGONREFUNDS };

const BY_HOST: Record<string, BrandConfig> = {
  [DRAGONBOT.appHost]: DRAGONBOT,
  [DRAGONREFUNDS.appHost]: DRAGONREFUNDS,
};

/**
 * Detect the active brand from the current window.location.hostname.
 * Falls back to DragonBot for localhost / preview URLs / any unknown
 * host — preserves developer ergonomics without silently applying the
 * wrong analytics IDs to a real user.
 */
export function detectBrand(): BrandConfig {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return BY_HOST[host] ?? DRAGONBOT;
}

export const ALL_BRANDS: readonly BrandConfig[] = [DRAGONBOT, DRAGONREFUNDS];
