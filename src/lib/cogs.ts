// COGS API client — wrappers over /v1/connections/:id/cogs/* following
// the keys.ts convention: return `{ error }` or data, never throw to
// the component.
//
// COGS (cost of goods sold) is user-uploaded, per SKU, effective-dated:
// a row applies from its `fromDate` until the next fromDate for the
// same (sku, asin, currency). The backend re-materializes the
// BigQuery `user_cogs` table + `orders_with_cogs` view after every
// mutation, so profit queries pick changes up within seconds.

import { ApiError, apiFetch } from "./api";
import { config } from "./config";
import { getSessionToken } from "./session";

export type CogsRow = {
  childAsin: string;
  /** "" = applies to every SKU of the ASIN (resolved from listings). */
  sku: string;
  /** YYYY-MM-DD; "1900-01-01" is the "from the beginning" sentinel. */
  fromDate: string;
  costItemValue: number;
  costShippingValue: number;
  currency: string;
  supplierName: string | null;
};

export const COGS_FROM_SENTINEL = "1900-01-01";

export type CogsUploadResult = {
  inserted: number;
  updated: number;
  unchanged: number;
  errors: { line: number; message: string }[];
};

export type CatalogRow = {
  sku: string;
  asin: string;
  name: string | null;
  imageUrl: string | null;
  price: number | null;
  quantity: number | null;
  status: string | null;
  fulfillmentChannel: string | null;
  /** Currently-effective cost, or null when the SKU has no COGS yet. */
  cogs: {
    costItemValue: number;
    costShippingValue: number;
    currency: string;
    fromDate: string;
    supplierName: string | null;
  } | null;
};

export type CatalogPage = {
  rows: CatalogRow[];
  total: number;
  /** false = listings report hasn't synced yet (fresh connection) —
   *  distinct from "no products". */
  listingsSynced: boolean;
};

/** The seller's real product catalog (from Amazon listings) merged with
 *  current effective costs — the §20 "fill in costs next to your
 *  products" editor's data source. */
export async function getCogsCatalog(
  connectionId: string,
  opts: { limit?: number; offset?: number; q?: string } = {},
): Promise<CatalogPage | { error: string }> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  if (opts.q) params.set("q", opts.q);
  const qs = params.toString();
  try {
    return await apiFetch<CatalogPage>(
      `/v1/connections/${encodeURIComponent(connectionId)}/cogs/catalog${qs ? `?${qs}` : ""}`,
    );
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't load your product catalog. Please try again." };
  }
}

export async function listCogs(
  connectionId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ rows: CogsRow[]; total: number } | { error: string }> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  const qs = params.toString();
  try {
    return await apiFetch<{ rows: CogsRow[]; total: number }>(
      `/v1/connections/${encodeURIComponent(connectionId)}/cogs${qs ? `?${qs}` : ""}`,
    );
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't load your COGS entries. Please try again." };
  }
}

export async function uploadCogsCsv(
  connectionId: string,
  csvText: string,
  opts: { format: "native" | "sellerboard"; currency?: string },
): Promise<CogsUploadResult | { error: string }> {
  const params = new URLSearchParams({ format: opts.format });
  if (opts.currency) params.set("currency", opts.currency);
  try {
    return await apiFetch<CogsUploadResult>(
      `/v1/connections/${encodeURIComponent(connectionId)}/cogs/upload?${params}`,
      {
        method: "PUT",
        headers: { "Content-Type": "text/csv" },
        body: csvText,
      },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      // 400 with row errors still carries the parse detail — surface it.
      const body = err.body as Partial<CogsUploadResult> | null;
      if (body && Array.isArray(body.errors) && body.errors.length > 0) {
        return { inserted: 0, updated: 0, unchanged: 0, errors: body.errors };
      }
      return { error: err.message };
    }
    return { error: "We couldn't upload this file. Please try again." };
  }
}

export async function upsertCogsRow(
  connectionId: string,
  row: {
    childAsin: string;
    sku?: string;
    fromDate?: string;
    costItemValue?: number;
    costShippingValue?: number;
    currency: string;
    /** Omit to preserve the stored supplier; "" or null clears it. */
    supplierName?: string | null;
  },
): Promise<{ inserted: number; updated: number; unchanged: number } | { error: string }> {
  try {
    return await apiFetch(
      `/v1/connections/${encodeURIComponent(connectionId)}/cogs/rows`,
      { method: "POST", body: JSON.stringify(row) },
    );
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't save this row. Please try again." };
  }
}

export async function clearCogs(
  connectionId: string,
): Promise<{ deleted: number } | { error: string }> {
  try {
    return await apiFetch<{ deleted: number }>(
      `/v1/connections/${encodeURIComponent(connectionId)}/cogs`,
      { method: "DELETE" },
    );
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't clear your COGS data. Please try again." };
  }
}

/** Download the current COGS as a CSV file (browser save dialog).
 *  Bypasses apiFetch — we need the raw body as a Blob, not JSON. */
export async function downloadCogsExport(connectionId: string): Promise<{ error?: string }> {
  try {
    const token = getSessionToken();
    const res = await fetch(
      `${config.apiUrl}/v1/connections/${encodeURIComponent(connectionId)}/cogs/export`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "omit" },
    );
    if (!res.ok) return { error: `Export failed (${res.status}).` };
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cogs.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return {};
  } catch {
    return { error: "We couldn't download the export. Please try again." };
  }
}

/** The sample file users can start from — mirrors the backend's
 *  accepted native format. */
export const COGS_SAMPLE_CSV = [
  "child_asin,sku,from,cost_item_value,cost_item_shipping_value,cost_currency,item_supplier_name",
  "B0EXAMPLE1,MY-SKU-1,2026-01-01,4.50,1.25,USD,Acme Corp",
  "B0EXAMPLE1,MY-SKU-1,2026-04-01,5.10,1.25,USD,Acme Corp",
  "B0EXAMPLE2,,2026-02-01,9.00,0,USD,",
].join("\n") + "\n";
