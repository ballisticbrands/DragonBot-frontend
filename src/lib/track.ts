// Lightweight funnel tracking for the app frontend.
//
// Fires GA4 events (via the gtag injected in main.tsx) and mirrors them as
// Clarity custom events. Safe no-op if either script is blocked / not loaded.
//
// The big funnel steps live elsewhere: `cta_click` on the LP, `sign_up` /
// `connect_amazon` in @ballisticbrands/frontend-shared. This is for
// app-local observation events (e.g. `ai_selected` on the signup picker).

type Params = Record<string, unknown>;

export function track(event: string, params: Params = {}): void {
  try {
    const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (typeof g === "function") g("event", event, params);
    const c = (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity;
    if (typeof c === "function") c("event", event);
  } catch {
    /* analytics must never break the app */
  }
}
