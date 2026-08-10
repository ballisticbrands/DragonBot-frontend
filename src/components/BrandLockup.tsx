import { Link } from "react-router-dom";

/**
 * The DragonBot logo lockup — the single definition used by every layout
 * (auth, app, docs), so /sign-up, /dashboard and /docs can no longer drift.
 *
 * Mirrors getdragonbot.com's Navbar (DragonBotLP/src/components/landing/Navbar.jsx):
 *   • /logos/dragonbot_fire.png at h-9, width auto — DragonBot's mark is the
 *     square fire icon, NOT the wide /DragonBot-logo.png the sibling brands use
 *   • "DragonBot" as one word in Clash Display bold, 20px, lh 1, 2px optical
 *     nudge down — no gradient, unlike Refunds and Reply
 *
 * The auth and docs headers used to render /DragonBot-logo.png (the wide 2.07:1
 * mark) at `h-7 w-7 rounded` — both the wrong logo AND squashed out of ratio.
 *
 * ⚠️ Two deliberate differences from the LP:
 *   1. The LP hardcodes text-[#1A1A1A] for its light navbar; the app tracks
 *      --foreground so theming keeps working.
 *   2. **The LP does not animate this mark — the app does** (`.logo-bob`),
 *      because the brief was for one bobbing lockup everywhere. DragonBot is
 *      therefore the one place where app and LP intentionally differ; the fix
 *      if that's unwanted is to add the bob to the LP, not remove it here.
 */
export function BrandLockup({
  to = "/",
  suffix,
}: {
  to?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <img
        src="/logos/dragonbot_fire.png"
        alt="DragonBot"
        className="logo-bob h-9 w-auto"
      />
      <span
        className="whitespace-nowrap font-clash text-xl font-bold text-[var(--foreground)]"
        style={{ lineHeight: "1", paddingTop: "2px" }}
      >
        DragonBot
      </span>
      {suffix}
    </Link>
  );
}
