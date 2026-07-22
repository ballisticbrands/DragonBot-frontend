# dragonbot-frontend

The DragonBot brand's app frontend. Deployed at **app.getdragonbot.com**
via GitHub Pages.

## Sibling repos + services

- **[dragonrefunds-frontend](https://github.com/ballisticbrands/dragonrefunds-frontend)** —
  Dragon Refunds brand's app (app.dragonrefunds.com). Same shape as
  this repo with a different brand config.
- **[frontend-shared](https://github.com/ballisticbrands/frontend-shared)** —
  npm package (`@ballisticbrands/frontend-shared`) that owns the
  auth flow, session/API client, brand context, Turnstile widget,
  verify-email banner, and auth-form hooks. See its README for the
  full shared-vs-per-brand boundary and dev loop.
- **[sellerconnect](https://github.com/ballisticbrands/sellerconnect)** —
  the shared backend at api.getdragonbot.com. Serves BOTH brand
  apps. Derives brand from the request's `Origin` header at
  `src/lib/brand.ts`.
- **[DragonBotLP](https://github.com/ballisticbrands/DragonBotLP)** —
  landing page at getdragonbot.com (separate repo, unrelated build).

## Multi-brand model — what to know

Users are shared across brand apps. Same backend, same User table,
same bearer tokens. A user who signs up on `app.dragonrefunds.com`
can enter the same credentials on `app.getdragonbot.com` and sign
in — no re-signup needed. What differs per brand:

- **Frontend build**: brand config in `src/brands/dragonbot.ts`
  (name, GA4 ID, Clarity ID, Turnstile site key, support email,
  header label).
- **Frontend hostname + repo**: this repo → `app.getdragonbot.com`;
  the sibling repo → `app.dragonrefunds.com`.
- **Verify-email link**: backend picks the brand's app URL from the
  Origin header on the sign-up POST.
- **SP-API / Ads OAuth `return_to`**: frontend sends its own app
  origin on `/start`; backend threads it through the JWT state
  token and bounces the seller back to the right app.
- **Analytics**: per-brand GA4 (G-W5BRXVBQNR here) + Clarity
  (vlbup1aiix here). Injected at runtime in `main.tsx` from the
  brand config — NOT hardcoded in `index.html`.

What is the SAME across brands:

- Backend (`api.getdragonbot.com`)
- Auth flow, session, API client (all in `@ballisticbrands/frontend-shared`)
- SES sender (`hello@getdragonbot.com` — per-brand identities exist
  in SES but aren't wired yet; see sellerconnect commits touching
  the mailer)
- Cloudflare Turnstile widget (single widget with multiple
  hostnames in its allowlist)

## Layout

```
src/
├── main.tsx              ← boot: configureShared(), analytics injection, BrandProvider
├── App.tsx               ← react-router routes
├── brands/
│   ├── dragonbot.ts      ← this brand's config (GA4, Clarity, name, etc.)
│   └── index.ts          ← re-exports + activeBrand() helper
├── lib/
│   ├── config.ts         ← build-time Vite config (apiUrl, turnstileSiteKey)
│   ├── connections.ts    ← SP-API/Ads /start + /reauth + /callback helpers
│   ├── keys.ts, cogs.ts, billing.ts, tools.ts  ← DragonBot-specific API surface
├── pages/
│   ├── Index.tsx         ← marketing landing
│   ├── SignUp.tsx        ← uses useSignUpForm from shared
│   ├── SignIn.tsx        ← uses useSignInForm from shared
│   ├── Dashboard.tsx     ← DragonBot-specific dashboard
│   ├── Docs.tsx
│   └── (VerifyEmail + ForgotPassword served from shared)
├── components/
│   ├── layout/           ← AuthLayout, AppLayout, DocsLayout
│   ├── dashboard/        ← DataTab, KeysTab, SettingsTab, SupportTab, ConnectionButtons, ...
│   └── ui/               ← Badge, Card, CopyButton, CodeBlock (brand-local primitives)
└── globals.css           ← Tailwind + CSS-var brand theme
```

Shared components (Button, Input, Label, Turnstile, VerifyEmailBanner,
VerifyEmailPage, ForgotPasswordPage) live in
`@ballisticbrands/frontend-shared` — import from there, don't
recreate locally.

## Boot sequence (main.tsx)

1. Resolve `activeBrand()` from `src/brands/`
2. `configureShared({ apiUrl, brand, turnstileSiteKey })` — sets
   the shared package's module-level singleton
3. Inject GA4 + Clarity scripts with this brand's IDs (moved out
   of `index.html` so per-brand IDs work)
4. Set document title + meta description from brand config
5. GitHub-Pages SPA-fallback restore (read stashed path from
   sessionStorage — see `public/404.html`)
6. `captureAttribution()` — snapshot first-touch UTMs / gclid /
   referrer / landing_page into localStorage
7. Render app inside `<BrandProvider brand={brand}>`

## Common tasks

**Add a new page.** Create `src/pages/Foo.tsx`, add a `<Route>` in
`App.tsx`. If the page needs brand info, `const brand = useBrand()`.
If it's an auth flow (sign-in/up variant, password reset, verify),
consider whether it should live in `frontend-shared` instead so
Dragon Refunds gets it too.

**Update the shared package dep.** Bump the version in
`package.json` (`"@ballisticbrands/frontend-shared": "^0.4.0"`),
`npm install`, verify locally, commit + push. Consumer CI uses
`npm install` (not `npm ci`) so lock-file bootstrap works even
when the dep is fresh.

**Change brand config.** Edit `src/brands/dragonbot.ts`. Analytics
IDs, header label, support email, meta description all live there.
No other file should hardcode "DragonBot" or a GA4 ID.

**Iterate on shared code locally.** From `frontend-shared`:
```bash
npm run build && npm link
```
From this repo:
```bash
npm link @ballisticbrands/frontend-shared
```
Rebuild shared (`npm run build`) after each change; Vite dev server
hot-reloads. When done: `npm unlink @ballisticbrands/frontend-shared`
+ `npm install` here to restore the pinned version.

## Deploy

Push to `main` → GitHub Actions runs `.github/workflows/deploy.yml`
→ Vite build → GitHub Pages picks up the artifact + reads
`public/CNAME` (`app.getdragonbot.com`) as its custom domain.

**DNS**: at Namecheap on `getdragonbot.com`, a CNAME on `app`
points at `ballisticbrands.github.io`. GitHub Pages auto-issues
Let's Encrypt cert.

**GH Packages auth**: `.npmrc` reads `NODE_AUTH_TOKEN`; CI sets it
to `GITHUB_TOKEN`. Local `npm install` needs a PAT with
`read:packages` on the ballisticbrands org (any classic PAT with
that scope works).

## Local dev

```bash
NODE_AUTH_TOKEN=<PAT> npm install   # needed once + on shared updates
npm run dev                          # http://localhost:5173
```

Local dev connects to `api.getdragonbot.com` (real prod backend)
unless `VITE_API_URL` is set in `.env.local`.
