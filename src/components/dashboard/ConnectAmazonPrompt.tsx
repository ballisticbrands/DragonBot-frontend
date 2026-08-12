// Full-page onboarding shown to a DragonBot user who has zero connected
// Amazon accounts. Nothing else on the dashboard is relevant until they
// connect — no tabs, no Keys manager, no Available Data card — because
// the whole product (your AI answering from your Amazon data) requires
// at least one connection.
//
// The user arrives here seconds after clicking "Send me my setup link"
// on /sign-up, so this page continues that promise rather than opening
// a generic dashboard: same eyebrow/card/trust-strip vocabulary as
// SignUp.tsx, a checklist with step 1 already done, and the same
// two-minute framing. Ported from DragonRefunds-frontend's
// ConnectSellerPrompt (the funnel this flow is modeled on).
//
// Step 3 — plugging DragonBot into the user's AI — is deliberately shown
// as "we'll have it ready" rather than actionable: the in-app connect-AI
// experience is a separate build. Until it ships, connecting Amazon
// drops the user into the tabbed dashboard, where the Keys tab covers it.
//
// Once at least one connection lands (Seller Central OR Ads — DragonBot
// is usable Ads-only), Dashboard.tsx switches to the full tabbed layout.

import { useState } from "react";
import { useSession } from "@ballisticbrands/frontend-shared";
import { CheckCircle, Clock, ExternalLink, Lock, Shield } from "@/components/ui/icons";
import { aiDisplayName, readAiChoice } from "@/lib/aiClients";
import { ConnectAmazonAdsButton, ConnectAmazonButton } from "./ConnectionButtons";

// Also in SignUp.tsx — the app's two references to the Appstore listing.
const APPSTORE_URL =
  "https://sellercentral.amazon.com/selling-partner-appstore/dp/amzn1.sp.solution.d78b7343-017b-4e68-92e4-a1defb51aa6f";

export function ConnectAmazonPrompt({ onConnected }: { onConnected: () => void }) {
  const session = useSession();
  const email = session.status === "authenticated" ? session.user.email : null;
  const aiName = aiDisplayName(readAiChoice());
  // Ads-only sellers exist (agencies, vendors) but they're the
  // exception — the Ads path stays collapsed behind a text link so the
  // page keeps exactly one primary action.
  const [showAds, setShowAds] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Free forever · no credit card
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-[1.1] tracking-[-0.03em]">
          Two steps left, then ask {aiName} anything about your account.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
          Connect your Amazon account — read-only, about two minutes — and your data starts
          syncing right away. Then one link plugs DragonBot into {aiName}.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border bg-[var(--card)] p-6 shadow-sm sm:p-8">
        <ol className="space-y-5">
          <li className="flex items-start gap-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--brand-green)] text-[var(--brand-green)]">
              <CheckCircle className="h-4 w-4" />
            </span>
            {/* Named after the email, not "Create your account" — signup
                is email-only, so the account framing both overstates what
                they did and reintroduces what /sign-up deliberately
                drops. Showing the address doubles as delivery
                confirmation for the setup email and a last chance to
                catch a typo while they still care. */}
            <div className="min-w-0 pt-0.5">
              <div className="text-sm font-semibold">Your email</div>
              <div className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                {email ? (
                  <>
                    Your setup link is on its way to{" "}
                    <strong className="font-semibold">{email}</strong>
                  </>
                ) : (
                  "Done."
                )}
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-bold text-[var(--background)]">
              2
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="text-sm font-semibold">Connect your Amazon account</div>
              <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Read-only, over Amazon's official SP-API. About two minutes — syncing starts
                immediately.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3.5">
            <span className="eta-badge flex h-7 w-7 shrink-0 items-center justify-center rounded-full border">
              <Clock className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="text-sm font-semibold">Plug DragonBot into {aiName}</div>
              <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                One connector link to paste — we'll have it ready. Then ask your first
                question: “What were my best-selling products last week?”
              </div>
            </div>
          </li>
        </ol>

        <div className="mt-7 border-t pt-7 text-center">
          <div className="flex justify-center">
            <ConnectAmazonButton
              label="Connect Amazon and start syncing"
              onConnected={() => {
                // No activation event here — onConnected() leads to the
                // dashboard's refresh + reconcileConnectionActivations(),
                // which fires from server state rather than the droppable
                // OAuth postMessage.
                onConnected();
              }}
            />
          </div>
          <p className="mt-3 text-[11.5px] text-[var(--muted-foreground)]">
            Read-only access. No card. Free forever.
          </p>
          {showAds ? (
            <div className="mt-4 flex flex-col items-center gap-1">
              <ConnectAmazonAdsButton variant="secondary" onConnected={onConnected} />
              <p className="text-[11.5px] text-[var(--muted-foreground)]">
                You can add Seller Central later from the dashboard.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAds(true)}
              className="mt-4 text-[11.5px] text-[var(--muted-foreground)] underline underline-offset-2 hover:text-[var(--foreground)]"
            >
              Ads-only account? Connect Amazon Ads instead
            </button>
          )}
        </div>
      </div>

      {/* trust strip */}
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
    </div>
  );
}
