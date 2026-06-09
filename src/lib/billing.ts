// Billing API client. Mirrors sellerconnect-frontend/src/app/actions/billing.ts
// — but since this is client-side, we navigate to the returned URL via
// window.location.href instead of Next.js's `redirect()`.

import { ApiError, apiFetch } from "./api";
import type { PlanId } from "./tools";

export async function startCheckout(plan: PlanId): Promise<{ error?: string }> {
  try {
    const { url } = await apiFetch<{ url: string }>("/v1/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
    if (!url) return { error: "No checkout URL returned." };
    window.location.href = url;
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Could not start checkout." };
  }
}

export async function openBillingPortal(): Promise<{ error?: string }> {
  try {
    const { url } = await apiFetch<{ url: string }>("/v1/billing/portal", { method: "POST" });
    if (!url) return { error: "No portal URL returned." };
    window.location.href = url;
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Could not open billing portal." };
  }
}
