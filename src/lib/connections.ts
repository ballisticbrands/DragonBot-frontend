// Connections API client. Mirrors sellerconnect-frontend/src/app/actions/connections.ts
// but as plain client-side fetch wrappers (no Server Actions, no
// revalidatePath — components manually refetch after mutations).

import { ApiError, apiFetch } from "./api";
import { activeBrand } from "@/brands";

// The active brand's app origin — sent as `return_to` on every OAuth
// /start POST so the backend threads it through the state JWT and
// bounces the seller back to THIS app after Amazon consent, not the
// default. Constant per repo (single-brand).
const RETURN_TO = activeBrand().appOrigin;

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
    const resp = await apiFetch<{ authorization_url: string }>(startPath, {
      method: "POST",
      body: JSON.stringify({ return_to: RETURN_TO }),
    });
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

/**
 * Re-authenticate an existing SP-API connection without losing its
 * BQ dataset / sync history. Backend UPDATES the row's refresh token
 * in place on the OAuth callback instead of creating a new Connection.
 *
 * Use case: seller was connected with limited SP-API scopes (e.g. no
 * Finance role for settlement reports) and needs to expand them.
 * Disconnecting + reconnecting would create a new connection with a
 * new BQ dataset (losing 30+ days of data); this endpoint preserves
 * everything.
 */
export async function reauthAmazonConnection(connectionId: string) {
  try {
    const resp = await apiFetch<{ authorization_url: string }>(
      "/v1/connect/amazon-selling-partner/reauth",
      {
        method: "POST",
        body: JSON.stringify({ connection_id: connectionId, return_to: RETURN_TO }),
      },
    );
    if (!resp.authorization_url) {
      return { error: "We couldn't start the re-authorization. Please try again." };
    }
    return { authorization_url: resp.authorization_url };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Could not start the re-authorization." };
  }
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

export type SyncStatus = {
  connection_id: string;
  provider: "amazon_selling_partner" | "amazon_ads" | string;
  dataset_id: string;
  // Most recent per-report sync outcome stamped by runInitialSync.
  // null until the first report finishes; updates as each report in
  // the batch lands.
  last_sync: {
    reportType?: string;
    reportTypeId?: string;
    status: "succeeded" | "failed";
    rowsLoaded?: number;
    bytesLoaded?: number;
    error?: string;
    reportId?: string;
    startedAt: string;
    finishedAt: string;
  } | null;
  // Non-null while an initial-sync batch is actively running. Cleared
  // by the orchestrator when the batch completes. Used by the UI to
  // distinguish "retry just started, last_sync is still the OLD
  // failed stamp" from "batch is genuinely done and last_sync is the
  // final word."
  batch_progress: {
    startedAt: string;
    nextIndex: number;
    total: number;
  } | null;
  // Live view of the per-connection BigQuery dataset (`__TABLES__`
  // metadata — no data scan, no billing).
  tables: Array<{ name: string; row_count: number; bytes: number; last_modified: string }>;
  total_rows: number;
  total_bytes: number;
  table_count: number;
  tables_with_rows: number;
  last_modified: string | null;
  // Catalog the backend's auto-trigger fans out over. Used to render a
  // "N of M reports" progress hint.
  expected_reports: number;
  marketplace_count: number;
  // True ceiling for "tables that should land" — already accounts for
  // multi-marketplace reports (1 table not N) and agency-profile
  // filtering on the Ads side. Use this instead of
  // expected_reports × marketplace_count for the dashboard denominator.
  expected_tables: number;
};

export async function getSyncStatus(connectionId: string): Promise<SyncStatus | null> {
  try {
    return await apiFetch<SyncStatus>(`/v1/connections/${encodeURIComponent(connectionId)}/sync-status`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return null;
  }
}

/** Kick off a fresh initial-sync batch for an SP-API connection that
 *  previously failed (or that the user wants to refresh). Returns 202
 *  on the backend and the orchestrator runs in the background — the
 *  caller should re-poll getSyncStatus to see progress. */
export async function triggerResync(connectionId: string): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/connections/${encodeURIComponent(connectionId)}/sync`, { method: "POST" });
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't restart the sync. Please try again." };
  }
}
