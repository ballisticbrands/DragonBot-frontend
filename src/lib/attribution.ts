// First-touch attribution capture + post-signup user identification.
//
// Two responsibilities:
//   1. captureAttribution() — on every page load, snapshot UTMs + click
//      IDs + referrer + landing URL from the visitor's FIRST landing and
//      persist to localStorage. Subsequent visits don't overwrite —
//      first-touch wins. The sign-up form reads this blob and POSTs it
//      to /v1/auth/sign-up, where the backend stamps it onto the User
//      row (see prisma/schema.prisma User attribution columns).
//   2. identifyUserAcrossPlatforms(userId) — after a successful sign-up
//      or sign-in, tell GA4 + Clarity + Meta about our user_id so
//      future sessions from this user cross-reference back to the
//      account (per TRACKING.md §4.2). Defensive: each call is
//      guarded on the tracker's global being defined, so a missing
//      script (e.g. Meta pixel not installed yet) is a silent no-op.

const STORAGE_KEY = "dragonbot_attribution_v1";

// Companion cookie written by getdragonbot.com (LP's initAttribution).
// Domain=.getdragonbot.com means the LP writes it and the app can read
// it — used as a fallback when the visitor navigated LP → app but the
// URL params got dropped somewhere (e.g. an explicit link without
// ?utm_… on it, or the GH-Pages SPA-fallback stripping the query).
const COOKIE_NAME = "dragonbot_attribution";

// GA4 measurement ID — kept in sync with the gtag('config', …) call in
// index.html. Change both if you rotate the property.
const GA4_MEASUREMENT_ID = "G-W5BRXVBQNR";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const CLICK_ID_KEYS = ["gclid", "fbclid", "msclkid"] as const;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  referrer?: string;
  landing_page?: string;
  captured_at?: string; // ISO 8601 — when we first saw this visitor
}

/**
 * Call once from the app's entry point (main.tsx). Safe to call
 * multiple times — no-op after the first successful capture. First-
 * touch model: if we've already captured on a previous page load,
 * this doesn't overwrite. That matches how attribution is normally
 * reasoned about ("where did this account come from" = the first
 * touchpoint, not the last).
 */
export function captureAttribution(): void {
  try {
    if (typeof window === "undefined") return; // SSR guard

    // First-touch semantics — but the correct semantics are "first
    // ATTRIBUTED touch", not "first touch at all." If the stored blob
    // has no UTMs and no click IDs, an earlier visit locked in a
    // blank / direct attribution — we let a later visit with a real
    // signal overwrite it. Otherwise a user who bookmarked us first
    // and later returned via a real campaign would be permanently
    // stuck as "direct."
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as Attribution;
        if (hasAttributionSignal(parsed)) return; // real first-touch — respect it
      } catch {
        // malformed stored blob — treat as fresh capture
      }
    }

    const params = new URLSearchParams(window.location.search);
    const blob: Attribution = { captured_at: new Date().toISOString() };

    let urlHadAttribution = false;
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) {
        blob[k] = v.slice(0, 256);
        urlHadAttribution = true;
      }
    }
    for (const k of CLICK_ID_KEYS) {
      const v = params.get(k);
      if (v) {
        blob[k] = v.slice(0, 256);
        urlHadAttribution = true;
      }
    }

    // Cookie fallback: if the URL didn't carry attribution but the LP
    // (getdragonbot.com) previously did — its initAttribution wrote
    // the values to a .getdragonbot.com-scoped cookie. Read that as a
    // secondary source so we don't lose the visitor's real source when
    // the URL query gets stripped somewhere in the flow (SPA fallback,
    // untagged Sign Up link, etc.).
    if (!urlHadAttribution) {
      const cookieAttr = readCookieAttribution();
      for (const [k, v] of Object.entries(cookieAttr)) {
        (blob as Record<string, string>)[k] = v;
      }
    }

    const referrer = document.referrer;
    if (referrer) blob.referrer = referrer.slice(0, 2048);

    // Full landing URL including query, but strip the fragment — never
    // carries attribution + can contain sensitive tokens in some flows.
    const landing =
      window.location.origin + window.location.pathname + window.location.search;
    blob.landing_page = landing.slice(0, 2048);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
  } catch {
    // localStorage disabled (Safari private mode, storage-full, blocked
    // third-party cookies with strict site isolation). Attribution is
    // best-effort — silently skip.
  }
}

/**
 * True when a stored / candidate attribution blob has any real
 * campaign / click-id signal. Used to decide whether first-touch
 * should lock in — a blob with only landing_page + referrer isn't
 * enough to shadow a later, properly-attributed visit.
 */
function hasAttributionSignal(a: Attribution): boolean {
  return !!(
    a.utm_source ||
    a.utm_medium ||
    a.utm_campaign ||
    a.utm_content ||
    a.utm_term ||
    a.gclid ||
    a.fbclid ||
    a.msclkid
  );
}

/**
 * Read the current attribution blob. Returns undefined when nothing
 * has been captured (e.g. localStorage disabled, or the visitor
 * bookmarked us and cleared their browser data between visits).
 */
export function readAttribution(): Attribution | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parse UTMs + click IDs from the `.getdragonbot.com`-scoped
 * `dragonbot_attribution` cookie the LP's initAttribution writes.
 * Returns an empty object if the cookie is absent or malformed. Used
 * as a fallback source when the URL didn't carry attribution keys —
 * see the call site in captureAttribution().
 */
function readCookieAttribution(): Partial<Attribution> {
  try {
    const match = document.cookie.match(
      new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)"),
    );
    if (!match) return {};
    const params = new URLSearchParams(decodeURIComponent(match[1]!));
    const out: Partial<Attribution> = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) out[k] = v.slice(0, 256);
    }
    for (const k of CLICK_ID_KEYS) {
      const v = params.get(k);
      if (v) out[k] = v.slice(0, 256);
    }
    return out;
  } catch {
    return {};
  }
}

// ─── Post-signup identification broadcast ─────────────────────────

// Minimal typings for the tracker globals. We don't own the SDK types
// (they load from CDN as global functions), so we shape just what we
// call. Optional at runtime — every call is guarded.
declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    clarity?: (command: string, ...args: unknown[]) => void;
    fbq?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Map first-touch attribution to a single coarse, NON-PII source label
 * safe to send to GA4 user properties + Clarity tags. Click-id presence
 * wins over utm_source because our paid campaigns (Google Ads
 * auto-tagging) carry a gclid but no utm_source. Falls back to "direct".
 */
function deriveSignupSource(a: Attribution | undefined): string {
  if (!a) return "direct";
  if (a.gclid) return "google_ads";
  if (a.fbclid) return "meta_ads";
  if (a.msclkid) return "microsoft_ads";
  if (a.utm_source) return a.utm_source;
  return "direct";
}

/**
 * Identify a signed-in/up user across our analytics platforms so their
 * sessions cross-reference back to the account. Call immediately after
 * a successful sign-up or sign-in.
 *
 * Fed the full user object (not just the id) so we can make sessions
 * human-searchable — the point being to pull up a user's recording
 * from their email without a DB round-trip to translate email→cuid.
 *
 * PII boundary — deliberate and load-bearing:
 *   · Clarity — first-party session tool; email + name go in as custom
 *               tags (filterable in the dashboard) + a friendly display
 *               name on `identify`.
 *   · GA4     — NEVER receives email/name. Google's ToS prohibits PII
 *               and violating it risks property suspension. GA4 gets the
 *               cuid as user_id + a coarse non-PII signup_source only;
 *               cross-reference GA4→account by joining on user_id in
 *               BigQuery.
 *   · Meta    — external_id = cuid (an opaque id, not PII).
 *
 * Each platform's call is a no-op when the tracker script isn't loaded
 * (checked via `typeof … === "function"`) — so the Meta pixel not yet
 * being installed is fine; this code starts working the moment the
 * pixel script lands in index.html.
 */
export function identifyUserAcrossPlatforms(user: {
  id: string;
  email?: string;
  name?: string;
}): void {
  const { id: userId, email, name } = user;
  if (!userId) return;

  const signupSource = deriveSignupSource(readAttribution());

  try {
    // GA4 — user_id becomes a property on every subsequent event in
    // this session AND stitches historical sessions from this device
    // once user-id reporting is enabled on the property. NON-PII only:
    // never send email/name here (Google ToS).
    if (typeof window.gtag === "function") {
      window.gtag("config", GA4_MEASUREMENT_ID, { user_id: userId });
      window.gtag("set", "user_properties", { signup_source: signupSource });
      // Also fire a canonical conversion event GA4 can attribute.
      window.gtag("event", "sign_up", { method: "email" });
    }
  } catch {
    /* best-effort */
  }

  try {
    // Clarity — tag this + future sessions with the account's real
    // identity, not just the opaque cuid. The 5th `identify` arg is a
    // friendly display name; custom tags set via `set` are filterable
    // in the Clarity dashboard, so support can search by email/name.
    if (typeof window.clarity === "function") {
      window.clarity("identify", userId, undefined, undefined, email ?? name ?? userId);
      if (email) window.clarity("set", "email", email);
      if (name) window.clarity("set", "name", name);
      window.clarity("set", "signup_source", signupSource);
    }
  } catch {
    /* best-effort */
  }

  try {
    // Meta pixel — CompleteRegistration fires as a conversion event;
    // external_id lets Meta match on future sessions and in Custom
    // Audiences. No-op when fbq isn't defined (pixel not installed).
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", "CompleteRegistration", { external_id: userId });
    }
  } catch {
    /* best-effort */
  }
}

// ─── Amazon account-connection events ─────────────────────────────

type ConnectionProvider = "amazon_seller" | "amazon_ads";

/**
 * Fire a "connected an Amazon account" event across analytics platforms
 * and flip a durable user property, so we can segment "serious" users
 * (connected seller / ads / both) for reporting + ad targeting.
 *
 * Call ONLY on a genuinely NEW connection — wire it from the connect
 * buttons, never the re-authenticate button (a re-auth reuses an
 * existing connection and shouldn't count as an activation). Runs under
 * the already-identified user (identifyUserAcrossPlatforms fired at
 * sign-in), so no user id is needed here.
 *
 * PII boundary matches identify(): GA4 gets the event + a boolean-ish
 * user property only (no email/name — Google ToS); Clarity gets a
 * custom event + filterable tag; Meta is a no-op until the pixel lands
 * in index.html.
 */
export function trackAccountConnected(provider: ConnectionProvider): void {
  const isSeller = provider === "amazon_seller";
  const eventName = isSeller ? "connect_amazon_seller" : "connect_amazon_ads";
  // Durable user property: lets GA4 audiences + Clarity segments filter
  // "serious" users. Idempotent — re-connecting just re-sets "true".
  const userProp = isSeller ? "spapi_connected" : "ads_connected";

  try {
    // GA4 — event (importable to Google Ads as a conversion) + a
    // user-scoped property (register it as a custom dimension to use in
    // reports/audiences). NON-PII only.
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, { provider });
      window.gtag("set", "user_properties", { [userProp]: "true" });
    }
  } catch {
    /* best-effort */
  }

  try {
    // Clarity — custom event (usable in Funnels/Smart events) + a
    // filterable tag so support can find connected users' recordings.
    if (typeof window.clarity === "function") {
      window.clarity("event", eventName);
      window.clarity("set", userProp, "true");
    }
  } catch {
    /* best-effort */
  }

  try {
    // Meta pixel — a conversion event for Custom Audiences / lookalikes.
    // No-op until the pixel script is added to index.html.
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", isSeller ? "ConnectSeller" : "ConnectAds");
    }
  } catch {
    /* best-effort */
  }
}
