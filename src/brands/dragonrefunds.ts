import type { BrandConfig } from "./types";

export const DRAGONREFUNDS: BrandConfig = {
  id: "dragonrefunds",
  appHost: "app.dragonrefunds.com",
  appOrigin: "https://app.dragonrefunds.com",
  headerLabel: "Dragon Refunds",
  displayName: "Dragon Refunds",
  metaDescription:
    "Dragon Refunds recovers Amazon FBA reimbursements. Connect your seller account via SP-API and see every place Amazon owes you money — do it yourself free, or hand it off for 15%.",
  supportEmail: "hello@dragonrefunds.com",
  ga4MeasurementId: "G-H3DKKWESYR",
  clarityId: "xpykdkfhjg",
  // Same postMessage namespace as DragonBot — the backend sends this
  // type regardless of tenant, so both brand frontends must listen for
  // the same value.
  oauthMessageType: "dragonbot-oauth-result",
  attributionCookieDomain: ".dragonrefunds.com",
};
