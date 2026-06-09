// API key management. Mirrors sellerconnect-frontend/src/app/actions/keys.ts.

import { ApiError, apiFetch } from "./api";
import type { ToolDomain } from "./tools";

export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: ToolDomain["id"][];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type MintedKey = ApiKey & {
  secret: string;
  // The backend returns ready-to-paste MCP connector strings. We don't
  // try to reconstruct these client-side — the connector URL contains a
  // signed JWT, not the plain ApiToken.id.
  mcp: {
    bearer: { url: string; header: string };
    signed_url: string;
  };
};

export async function listApiKeys(): Promise<ApiKey[]> {
  try {
    return await apiFetch<ApiKey[]>("/v1/keys");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    return [];
  }
}

export async function createApiKey(input: {
  name: string;
  scopes: ToolDomain["id"][];
}): Promise<{ key: MintedKey } | { error: string }> {
  if (!input.name.trim()) return { error: "Name is required." };
  try {
    const key = await apiFetch<MintedKey>("/v1/keys", {
      method: "POST",
      body: JSON.stringify({ name: input.name.trim(), scopes: input.scopes }),
    });
    return { key };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't create this key. Please try again." };
  }
}

export async function revokeApiKey(id: string): Promise<{ error?: string }> {
  try {
    await apiFetch(`/v1/keys/${encodeURIComponent(id)}`, { method: "DELETE" });
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't revoke this key. Please try again." };
  }
}
