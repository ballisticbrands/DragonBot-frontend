import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthDivider,
  Button,
  GoogleSignInButton,
  Input,
  Label,
  Turnstile,
  useBrand,
  useSignUpForm,
} from "@ballisticbrands/frontend-shared";
import { config } from "@/lib/config";
import { track } from "@/lib/track";
import {
  AI_CLIENTS,
  aiDisplayName,
  parseAiParam,
  readAiChoice,
  saveAiChoice,
  type AiClientId,
} from "@/lib/aiClients";
import { ArrowRight, CheckCircle, Clock, ExternalLink, Lock, Shield } from "@/components/ui/icons";

// Also in ConnectAmazonPrompt.tsx — the app's two references to the
// Appstore listing. Same URL the LP's trust strip links to.
const APPSTORE_URL =
  "https://sellercentral.amazon.com/selling-partner-appstore/dp/amzn1.sp.solution.d78b7343-017b-4e68-92e4-a1defb51aa6f";

/**
 * Sign-up, led by the LP's promise instead of an account form.
 *
 * The visitor arrives from getdragonbot.com, where every surface says
 * "Connect your AI to Amazon Seller Central. Free forever." This page
 * used to answer that with "Start your trial — seven days free" and four
 * form fields; the funnel data (Dragon-marketing ADS_STATUS.md) showed
 * the drop-off concentrated exactly here. So the page now continues the
 * promise: same free-forever framing, the visitor's chosen AI by name
 * (`?ai=` from the LP hero buttons), a preview of the payoff, and email
 * as the only field. Modeled on DragonRefunds-frontend/src/pages/SignUp.tsx.
 *
 * ── Email is the only field ──────────────────────────────────────────
 * No name (the backend's parseName() already treats it as optional) and
 * no password input. The email is genuinely needed — the backend sends
 * the setup link there (sellerconnect email-templates/setup.ts), which
 * is also what makes an email-only ask feel legitimate.
 *
 * `/v1/auth/sign-up` still requires a password ≥8 chars, so we generate
 * a random one per signup and never show it. It must be RANDOM, not a
 * shared constant: /sign-in accepts email+password, so one well-known
 * password across all accounts would let anyone who knows a customer's
 * email walk into an account holding Amazon SP-API buyer PII.
 *
 * Nobody ever learns this password, which is fine — the planned
 * magic-link flow mints a session directly and never needs it, and
 * /forgot-password already covers anyone who wants a real one.
 */
function generatePassword(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(24);
  c.getRandomValues(b);
  return Array.from(b, (n) => n.toString(16).padStart(2, "0")).join("");
}

export function SignUp() {
  const navigate = useNavigate();
  const brand = useBrand();
  const [searchParams] = useSearchParams();
  const [googleError, setGoogleError] = useState<string | null>(null);

  // AI choice: URL param (LP hero buttons pass ?ai=claude etc.) beats
  // a previously stored choice beats the Claude default. Persisted so
  // the dashboard onboarding checklist can name the same client.
  const [ai, setAi] = useState<AiClientId>(
    () => parseAiParam(searchParams.get("ai")) ?? readAiChoice() ?? "claude",
  );
  useEffect(() => {
    saveAiChoice(ai);
  }, [ai]);

  const aiName = aiDisplayName(ai);

  const form = useSignUpForm({
    onSuccess: () => {
      // The `sign_up` GA4/Clarity/Meta events fire from the shared
      // identifyUserAcrossPlatforms() (after the post-signup /me
      // lookup), which also sets user_id + user_properties. Firing
      // anything here would double-count the conversion — only navigate.
      navigate("/dashboard", { replace: true });
    },
  });

  // Seed the hidden password once, on mount — not per render, which would
  // change it mid-typing, and not inside onSubmit, where the hook would
  // still be holding the previous (empty) state when it posts.
  const { setPassword } = form;
  useEffect(() => {
    setPassword(generatePassword());
  }, [setPassword]);

  useEffect(() => {
    document.title = `Connect your AI to Seller Central — ${brand.displayName}`;
  }, [brand.displayName]);

  return (
    <div>
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Free forever · no credit card
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-[1.1] tracking-[-0.03em]">
          {ai === "other" ? "Your AI, meet your Seller Central." : `${aiName}, meet your Seller Central.`}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
          Give {aiName} secure, read-only access to your real Amazon data — orders, ads,
          inventory, reviews, and more. About two minutes to set up.
        </p>
      </div>

      {/* Two vertical halves: the payoff preview on the left, the signup
          form on the right. They stack (preview first) below lg, where
          side-by-side would leave each half too narrow for the form
          fields. Same shell as DragonRefunds' calculator sign-up:
          `lg:divide-x` draws the split as a real divider rather than a
          gap, and grid's default items-stretch runs the rule full height. */}
      <div className="mt-8 grid grid-cols-1 gap-8 rounded-2xl border bg-[var(--card)] p-6 shadow-sm sm:p-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-[var(--border)]">
        {/* ── LEFT: pick your AI + the payoff preview ─────────────────── */}
        <div className="min-w-0 lg:pr-8 xl:pr-10">
          <div className="text-[13px] font-semibold">
            Which AI do you use?
            <span className="block text-[11px] font-normal text-[var(--muted-foreground)]">
              we'll tailor the setup to it
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {AI_CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={ai === c.id}
                onClick={() => {
                  setAi(c.id);
                  track("ai_selected", { ai_client: c.id, page_path: "/sign-up" });
                }}
                className={`rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                  ai === c.id
                    ? "border-[var(--brand-green)] bg-[var(--brand-green)]/5 text-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* The payoff, shown not told: what a chat with their AI looks
              like once DragonBot is plugged in. Static mock — the LP's
              animated demo already did the selling; this is a reminder of
              what the form buys. */}
          <div className="mt-6 overflow-hidden rounded-xl border">
            <div className="flex items-center gap-2 border-b bg-[var(--muted)] px-3.5 py-2">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-green-light)]" />
              <span className="text-[12px] font-semibold">
                {ai === "other" ? "Your AI" : aiName}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                · connected to your Seller Central
              </span>
            </div>
            <div className="space-y-3 p-3.5">
              <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm bg-[var(--foreground)] px-3 py-2 text-[12.5px] text-[var(--background)]">
                What were my best-selling products last week?
              </div>
              <div className="w-fit max-w-[92%] rounded-xl rounded-bl-sm border bg-[var(--card)] px-3 py-2 text-[12.5px] leading-relaxed">
                Your top 3 by units, Aug 3–9:
                <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[12px]">
                  <li>Bamboo Cutting Board — 412 units · $8,240</li>
                  <li>Silicone Baking Mat (2-pack) — 268 units · $4,556</li>
                  <li>Chef's Knife 8" — 191 units · $5,158</li>
                </ol>
                <span className="mt-1 block text-[11px] text-[var(--muted-foreground)]">
                  Pulled from your live Seller Central data. Want the ad spend behind each?
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">
            That's the whole product: {aiName} answering from your real Amazon data — orders,
            ads, inventory, reviews, customer messages — with pre-built skills for PPC audits,
            keyword research, forecasts, and more.
          </p>
        </div>

        {/* ── RIGHT: the signup form ─────────────────────────────────── */}
        <form className="space-y-4 lg:pl-8 xl:pl-10" onSubmit={form.onSubmit}>
          {/* Heading + the bridge from preview to deliverable: the email
              buys the setup link, not "an account". */}
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">
              Where should we send your setup link?
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              Create your free account and we email you the link that plugs DragonBot into{" "}
              {aiName} — finish right here, or later on your computer.
            </p>
          </div>

          {/* Turnaround promise, not a countdown. Frames the email field
              below as the last step before the payoff. */}
          <div className="eta-badge flex items-center gap-4 rounded-xl border p-4">
            <Clock className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-[13px] font-bold leading-tight">
                Ready in about two minutes
              </div>
              <p className="mt-0.5 text-[11.5px] leading-snug opacity-90">
                connect Amazon (read-only), paste one link into {aiName}, ask your first
                question
              </p>
            </div>
          </div>

          {/* Google path skips the whole form (and Turnstile — Google's
              own bot defenses stand in for it; the backend doesn't
              require a captcha on /v1/auth/google). */}
          {config.googleClientId && (
            <>
              <GoogleSignInButton
                text="signup_with"
                onSuccess={() => navigate("/dashboard", { replace: true })}
                onError={setGoogleError}
              />
              {googleError && (
                <p className="text-center text-sm text-[var(--danger)]">{googleError}</p>
              )}
              <AuthDivider label="or sign up with email" />
            </>
          )}
          {/* The only field. No name (optional server-side anyway) and no
              password inputs — see generatePassword() above. */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@yourcompany.com"
              required
              autoFocus
              value={form.email}
              onChange={(e) => form.setEmail(e.target.value)}
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              Your setup link lands here — double-check it. No password to create.
            </p>
          </div>

          <Turnstile onToken={form.onTurnstileToken} onExpired={form.onTurnstileExpired} />
          {form.error && <p className="text-sm text-[var(--danger)]">{form.error}</p>}

          <Button
            type="submit"
            disabled={form.pending || !form.turnstileToken}
            className="flex w-full items-center justify-center gap-2"
          >
            {form.pending ? "Creating account…" : "Send me my setup link"}
            {!form.pending && <ArrowRight className="h-4 w-4" />}
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            By continuing you agree to our{" "}
            <a
              href="https://getdragonbot.com/tos"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="https://getdragonbot.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </div>

      {/* trust strip — same three signals, same order, as the LP hero's */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12.5px] font-medium">
        <a
          href={APPSTORE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-[var(--brand-green)] hover:opacity-70"
        >
          <CheckCircle className="h-4 w-4" />
          <span className="underline underline-offset-2">Amazon approved</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
        <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <Lock className="h-4 w-4 text-[var(--brand-green)]" />
          Read-only access over Amazon's official API
        </span>
        <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <Shield className="h-4 w-4 text-[var(--brand-green)]" />
          Amazon ToS compliant
        </span>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link to="/sign-in" className="font-medium text-[var(--foreground)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
