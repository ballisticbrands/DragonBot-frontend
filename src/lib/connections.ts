// Connections API client. Mirrors sellerconnect-frontend/src/app/actions/connections.ts
// but as plain client-side fetch wrappers (no Server Actions, no
// revalidatePath — components manually refetch after mutations).

import { ApiError, apiFetch } from "./api";

export type Connection = {
  id: string;
  provider: "amazon-selling-partner" | "amazon-ads";
  status: "pending" | "connected" | "error" | "expired";
  connected_at?: string | null;
  error?: string | null;
  name?: string | null;
  // Identifying info extracted from the customer's synced data
  // (BigQuery Orders / profiles tables). null/empty if the first
  // sync hasn't landed yet.
  seller_id?: string | null;
  marketplace_ids?: string[];
  countries?: string[];
  profile_ids?: number[];
  account_name?: string | null;
  account_type?: string | null;
  synced_order_count?: number | null;
  brands?: string[];
  currencies?: string[];
};

export async function listConnections(): Promise<Connection[]> {
  try {
    return await apiFetch<Connection[]>("/v1/connections");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    return [];
  }
}

async function startConnection(
  startPath: string,
  errorLabel: string,
): Promise<{ authorization_url?: string; error?: string }> {
  try {
    const resp = await apiFetch<{ authorization_url: string }>(startPath, { method: "POST" });
    if (!resp.authorization_url) return { error: "We couldn't start the connection. Please try again." };
    return { authorization_url: resp.authorization_url };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: errorLabel };
  }
}

export async function startAmazonConnection() {
  return startConnection(
    "/v1/connect/amazon-selling-partner/start",
    "Could not start the Amazon connection.",
  );
}

export async function startAmazonAdsConnection() {
  return startConnection(
    "/v1/connect/amazon-ads/start",
    "Could not start the Amazon Ads connection.",
  );
}

export async function disconnectConnection(id: string): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/connections/${encodeURIComponent(id)}`, { method: "DELETE" });
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't disconnect this account. Please try again." };
  }
}
