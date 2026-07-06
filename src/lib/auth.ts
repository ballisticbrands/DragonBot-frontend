// Auth API client. Replaces sellerconnect-frontend/src/app/actions/auth.ts
// (which used Next.js Server Actions). Each function returns either the
// success result or an { error } object — UI components handle both.

import { ApiError, apiFetch } from "./api";
import { clearSessionToken, setSessionToken } from "./session";
import { identifyUserAcrossPlatforms, readAttribution } from "./attribution";

type TokenResponse = { token: string; expires_in?: number };
type MeResponse = { id: string; email: string; name?: string };

async function exchange(path: string, payload: Record<string, unknown>): Promise<{ error?: string }> {
  try {
    const { token } = await apiFetch<TokenResponse>(path, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
    if (!token) return { error: "Something went wrong. Please try again." };
    setSessionToken(token);

    // Fire-and-forget: fetch the user id + broadcast it into GA4 /
    // Clarity / Meta so future sessions from this user cross-reference
    // back to the account. Failures are silent — attribution is best-
    // effort and shouldn't block the sign-in/up flow.
    void (async () => {
      try {
        const me = await apiFetch<MeResponse>("/v1/auth/me");
        if (me?.id) identifyUserAcrossPlatforms(me.id);
      } catch {
        /* ignored — best-effort */
      }
    })();

    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    if (err instanceof TypeError) return { error: "We couldn't reach our servers. Please try again in a moment." };
    return { error: "Something went wrong. Please try again." };
  }
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  if (!email || !password) return { error: "Email and password are required." };
  return exchange("/v1/auth/sign-in", { email, password });
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ error?: string }> {
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  // First-touch attribution: reads the blob localStorage stashed on the
  // visitor's first landing (see src/lib/attribution.ts + main.tsx).
  // Backend accepts it under `attribution` in the body; undefined =
  // omit-the-field (matches an all-null attribution snapshot).
  const attribution = readAttribution();
  return exchange("/v1/auth/sign-up", { email, password, name, attribution });
}

export async function requestPasswordReset(email: string): Promise<{ error?: string }> {
  if (!email) return { error: "Email is required." };
  try {
    await apiFetch("/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    });
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "We couldn't send the reset email. Please try again." };
  }
}

export async function signOut(): Promise<void> {
  try {
    await apiFetch("/v1/auth/sign-out", { method: "POST" });
  } catch {
    // best-effort
  }
  clearSessionToken();
}
