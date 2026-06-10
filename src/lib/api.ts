// Client-side fetch wrapper for the DragonBot backend.
// Mirrors sellerconnect-frontend/src/lib/api.ts but works in the browser:
// the auth token comes from localStorage (set on sign-in) instead of an
// HTTP-only cookie (set by a Next.js Server Action).

import { SESSION_KEY, config } from "./config";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type FetchOpts = RequestInit & { auth?: boolean };

function readToken(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { auth = true, headers, ...rest } = opts;
  const url = path.startsWith("http") ? path : `${config.apiUrl}${path}`;

  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = readToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...rest, headers: finalHeaders, credentials: "omit" });
  const text = await res.text();
  let body: unknown = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // leave as text
    }
  }

  if (!res.ok) {
    // Backend errors come back as { error: "Title", detail?: "Specifics" }.
    // Surface both when present so operator-facing failures (Airbyte 403,
    // SP-API throttling, etc.) make it to the toast.
    const errStr =
      body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : null;
    const detailStr =
      body && typeof body === "object" && "detail" in body && typeof (body as { detail: unknown }).detail === "string"
        ? (body as { detail: string }).detail
        : null;
    const message =
      (errStr && detailStr ? `${errStr}: ${detailStr}` : errStr) ??
      `Request failed: ${res.status} ${res.statusText}`;
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}
