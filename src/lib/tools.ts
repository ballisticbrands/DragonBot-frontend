// Tool catalog metadata + subscription plans. Kept identical across the
// brand frontends; the backend's tool inventory is the same for every
// tenant (one engine, many brands).
//
// `id` values are the API-key SCOPES the backend accepts at
// POST /v1/keys, and must match the backend's exposed tool CATEGORIES —
// `grantableScopes()` in sellerconnect `src/lib/tool-scopes.ts`, derived
// from the tool registry. A scope the backend doesn't expose is not
// grantable: it's dropped, and a request naming only such scopes is
// rejected outright (a key with no scopes would otherwise be stored as
// unrestricted). So an id that drifts out of that set silently produces
// a checkbox that grants nothing — keep this list honest.
//
// ⚠️ The `research` domain (11 Keepa / Jungle Scout product, pricing and
// keyword tools) was REMOVED on 2026-08-17: the operator retired those
// vendor subscriptions, and a user creating a key must not be able to
// enable them. This is a product decision, not a bug — the tools worked.
// The backend enforces it independently of this file (that is the point:
// a cached bundle must not be able to grant a retired scope), so do not
// re-add the domain here expecting it to work. Background + the
// un-retirement procedure: sellerconnect `principles/mcp-tools.md`
// §"Retiring a tool category".

export type ToolDomain = {
  id: "accounts" | "reports" | "recipes";
  name: string;
  description: string;
  toolCount: number;
};

export const TOOL_DOMAINS: ToolDomain[] = [
  {
    id: "accounts",
    name: "Accounts",
    description:
      "List the seller's connected upstream accounts and check each one's connection + sync health.",
    toolCount: 2,
  },
  {
    id: "reports",
    name: "Reports",
    description:
      "Read the seller's BigQuery-backed Amazon data — Selling Partner reports (orders, inventory, returns, listings, brand analytics) and Advertising reports (Sponsored Products, Brands, Display, Attribution). Generic surface: list_reports discovers what's available, get_report_data fetches rows with optional filters and date ranges.",
    toolCount: 2,
  },
  {
    // Previously missing from this list, which meant any scoped key was
    // minted WITHOUT the recipe tools — even though the server's
    // always-on instructions tell the agent to check list_recipes first.
    id: "recipes",
    name: "Recipes",
    description:
      "Canonical analytical playbooks the agent follows instead of improvising — TACOS, wasted ad spend, negative-keyword harvesting, search-term graduation, reimbursement audits. list_recipes browses them, get_recipe returns the exact tables, columns and filters for one.",
    toolCount: 2,
  },
];

export const TOTAL_TOOL_COUNT = TOOL_DOMAINS.reduce((n, d) => n + d.toolCount, 0);

export type PlanId = "full_suite";
export const PLANS: {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  domains: ToolDomain["id"][];
}[] = [
  {
    id: "full_suite",
    name: "Full Suite",
    price: 79,
    description:
      "Every tool — Amazon Selling Partner + Ads reports, account health, and the analytical recipe library.",
    domains: ["accounts", "reports", "recipes"],
  },
];
