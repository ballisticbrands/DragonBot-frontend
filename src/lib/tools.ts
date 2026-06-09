// Tool catalog metadata + subscription plans. Copied verbatim from
// sellerconnect-frontend; the backend's tool inventory is identical
// across tenants (one engine, many brands).

export type ToolDomain = {
  id: "accounts" | "reports" | "research";
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
      "Read the seller's BigQuery-backed Amazon data — Selling Partner reports (orders, inventory, returns, listings, brand analytics) and Advertising report streams (Sponsored Products, Brands, Display, Attribution). Generic surface: list_reports discovers what's available, get_report_data fetches rows with optional filters and date ranges.",
    toolCount: 2,
  },
  {
    id: "research",
    name: "Research",
    description:
      "Market and competitive intelligence. Product lookups, price history, sales estimates, keyword data, share of voice.",
    toolCount: 11,
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
      "Every tool — Amazon Selling Partner + Ads reports, account health, and market research.",
    domains: ["accounts", "reports", "research"],
  },
];
